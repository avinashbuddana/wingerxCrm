import {
  BadGatewayException,
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';

import { EmailDriver } from 'src/engine/core-modules/email/enums/email-driver.enum';
import { EmailService } from 'src/engine/core-modules/email/email.service';
import { TwentyConfigService } from 'src/engine/core-modules/twenty-config/twenty-config.service';
import { SendWingerXEmailDto } from 'src/modules/wingerx/dtos/send-wingerx-email.dto';
import { SendWingerXWhatsAppDto } from 'src/modules/wingerx/dtos/send-wingerx-whatsapp.dto';

type NotificationResult = {
  channel: 'email' | 'whatsapp';
  status: 'queued' | 'accepted';
  providerMessageId?: string;
};

type MetaSendResponse = {
  messages?: Array<{ id?: string }>;
  error?: { message?: string; code?: number };
};

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 30;
const IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1_000;

@Injectable()
export class WingerXNotificationService {
  private readonly logger = new Logger(WingerXNotificationService.name);
  private readonly attempts = new Map<string, number[]>();
  private readonly idempotencyResults = new Map<
    string,
    { expiresAt: number; result: NotificationResult }
  >();

  constructor(
    private readonly emailService: EmailService,
    private readonly twentyConfigService: TwentyConfigService,
  ) {}

  getConfiguration() {
    const emailDriver = this.twentyConfigService.get('EMAIL_DRIVER');
    const emailHost = this.twentyConfigService.get('EMAIL_SMTP_HOST');
    const emailFromAddress = this.twentyConfigService.get('EMAIL_FROM_ADDRESS');
    const whatsappAccessToken = this.twentyConfigService.get(
      'META_WHATSAPP_ACCESS_TOKEN',
    );
    const whatsappPhoneNumberId = this.twentyConfigService.get(
      'META_WHATSAPP_PHONE_NUMBER_ID',
    );

    return {
      email: {
        configured: Boolean(
          emailDriver !== EmailDriver.LOGGER && emailHost && emailFromAddress,
        ),
        provider: emailDriver,
      },
      whatsapp: {
        configured: Boolean(whatsappAccessToken && whatsappPhoneNumberId),
        graphVersion: this.twentyConfigService.get(
          'META_WHATSAPP_GRAPH_VERSION',
        ),
        defaultLanguage: this.twentyConfigService.get(
          'META_WHATSAPP_DEFAULT_LANGUAGE',
        ),
        defaultTemplate: this.twentyConfigService.get(
          'META_WHATSAPP_DEFAULT_TEMPLATE',
        ),
      },
    };
  }

  async sendEmail(
    workspaceId: string,
    input: SendWingerXEmailDto,
  ): Promise<NotificationResult> {
    this.assertConsent(input.consentConfirmed);
    this.assertRateLimit(workspaceId, 'email');

    const cached = this.getIdempotentResult(
      workspaceId,
      'email',
      input.idempotencyKey,
    );

    if (cached) return cached;

    if (!this.getConfiguration().email.configured) {
      throw new ServiceUnavailableException(
        'Email is not configured. Set EMAIL_DRIVER and the matching provider settings.',
      );
    }

    const fromName = this.twentyConfigService.get('EMAIL_FROM_NAME');
    const fromAddress = this.twentyConfigService.get('EMAIL_FROM_ADDRESS');

    await this.emailService.send({
      to: input.to.trim(),
      from: `${fromName} <${fromAddress}>`,
      subject: input.subject.trim(),
      text: input.message.trim(),
      html: this.toSafeHtml(input.message.trim()),
    });

    const result: NotificationResult = {
      channel: 'email',
      status: 'queued',
    };

    this.rememberResult(workspaceId, input.idempotencyKey, result);
    this.logger.log(
      `Queued WingerX email for workspace ${workspaceId} (${input.clientReference ?? 'no client reference'})`,
    );

    return result;
  }

  async sendWhatsApp(
    workspaceId: string,
    input: SendWingerXWhatsAppDto,
  ): Promise<NotificationResult> {
    this.assertConsent(input.consentConfirmed);
    this.assertRateLimit(workspaceId, 'whatsapp');

    const cached = this.getIdempotentResult(
      workspaceId,
      'whatsapp',
      input.idempotencyKey,
    );

    if (cached) return cached;

    const accessToken = this.twentyConfigService.get(
      'META_WHATSAPP_ACCESS_TOKEN',
    );
    const phoneNumberId = this.twentyConfigService.get(
      'META_WHATSAPP_PHONE_NUMBER_ID',
    );
    const graphVersion = this.twentyConfigService.get(
      'META_WHATSAPP_GRAPH_VERSION',
    );

    if (!accessToken || !phoneNumberId) {
      throw new ServiceUnavailableException(
        'WhatsApp is not configured. Set META_WHATSAPP_ACCESS_TOKEN and META_WHATSAPP_PHONE_NUMBER_ID.',
      );
    }

    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: input.to.replace(/^\+/, ''),
      type: 'template',
      template: {
        name: input.templateName,
        language: { code: input.languageCode },
        ...(input.variables.length > 0
          ? {
              components: [
                {
                  type: 'body',
                  parameters: input.variables.map((text) => ({
                    type: 'text',
                    text,
                  })),
                },
              ],
            }
          : {}),
      },
    };

    const url = `https://graph.facebook.com/${graphVersion}/${phoneNumberId}/messages`;
    const response = await this.fetchMetaWithRetry(url, accessToken, payload);
    const body = (await response.json().catch(() => ({}))) as MetaSendResponse;

    if (!response.ok) {
      this.logger.error(
        `Meta WhatsApp rejected a WingerX message for workspace ${workspaceId}: ${body.error?.code ?? response.status}`,
      );
      throw new BadGatewayException(
        body.error?.message ?? 'Meta WhatsApp rejected the message.',
      );
    }

    const result: NotificationResult = {
      channel: 'whatsapp',
      status: 'accepted',
      providerMessageId: body.messages?.[0]?.id,
    };

    this.rememberResult(workspaceId, input.idempotencyKey, result);
    this.logger.log(
      `Meta accepted WingerX WhatsApp message for workspace ${workspaceId} (${input.clientReference ?? 'no client reference'})`,
    );

    return result;
  }

  private assertConsent(consentConfirmed: boolean) {
    if (!consentConfirmed) {
      throw new BadRequestException(
        'Recipient consent must be confirmed before sending.',
      );
    }
  }

  private assertRateLimit(workspaceId: string, channel: string) {
    const key = `${workspaceId}:${channel}`;
    const now = Date.now();
    const recent = (this.attempts.get(key) ?? []).filter(
      (timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS,
    );

    if (recent.length >= RATE_LIMIT_MAX) {
      throw new HttpException(
        `WingerX ${channel} limit reached. Try again in one minute.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    recent.push(now);
    this.attempts.set(key, recent);
  }

  private getIdempotentResult(
    workspaceId: string,
    channel: string,
    idempotencyKey: string,
  ) {
    const key = `${workspaceId}:${channel}:${idempotencyKey}`;
    const cached = this.idempotencyResults.get(key);

    if (!cached) return undefined;
    if (cached.expiresAt < Date.now()) {
      this.idempotencyResults.delete(key);
      return undefined;
    }

    return cached.result;
  }

  private rememberResult(
    workspaceId: string,
    idempotencyKey: string,
    result: NotificationResult,
  ) {
    const key = `${workspaceId}:${result.channel}:${idempotencyKey}`;

    this.idempotencyResults.set(key, {
      expiresAt: Date.now() + IDEMPOTENCY_TTL_MS,
      result,
    });
  }

  private async fetchMetaWithRetry(
    url: string,
    accessToken: string,
    payload: object,
  ): Promise<Response> {
    let response: Response | undefined;

    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        response = await fetch(url, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(15_000),
        });
      } catch (error) {
        if (attempt === 2) {
          throw new BadGatewayException(
            `Could not reach Meta WhatsApp: ${error instanceof Error ? error.message : 'network error'}`,
          );
        }
      }

      if (response && response.status !== 429 && response.status < 500) {
        return response;
      }

      if (attempt < 2) {
        await new Promise((resolve) =>
          setTimeout(resolve, attempt === 0 ? 400 : 1_000),
        );
      }
    }

    if (!response) {
      throw new BadGatewayException('Could not reach Meta WhatsApp.');
    }

    return response;
  }

  private toSafeHtml(message: string) {
    return message
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
      .replace(/\n/g, '<br />');
  }
}
