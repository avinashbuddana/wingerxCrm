import { useCallback, useEffect, useState } from 'react';

import { REST_API_BASE_URL } from '@/apollo/constant/rest-api-base-url';

export type WingerXNotificationConfiguration = {
  email: { configured: boolean; provider: string };
  whatsapp: {
    configured: boolean;
    graphVersion: string;
    defaultLanguage: string;
    defaultTemplate: string;
  };
};

export type WingerXNotificationResult = {
  channel: 'email' | 'whatsapp';
  status: 'queued' | 'accepted';
  providerMessageId?: string;
};

type EmailInput = {
  to: string;
  subject: string;
  message: string;
  consentConfirmed: boolean;
  clientName?: string;
  clientReference?: string;
};

type WhatsAppInput = {
  to: string;
  templateName: string;
  languageCode: string;
  variables: string[];
  consentConfirmed: boolean;
  clientName?: string;
  clientReference?: string;
};

const parseError = async (response: Response) => {
  const body = (await response.json().catch(() => ({}))) as {
    message?: string | string[];
  };
  const message = Array.isArray(body.message)
    ? body.message.join(' ')
    : body.message;

  return message ?? `Request failed (${response.status})`;
};

export const useWingerXNotifications = () => {
  const [configuration, setConfiguration] =
    useState<WingerXNotificationConfiguration | null>(null);
  const [isLoadingConfiguration, setIsLoadingConfiguration] = useState(true);
  const [isSending, setIsSending] = useState(false);

  const loadConfiguration = useCallback(async () => {
    setIsLoadingConfiguration(true);
    try {
      const response = await fetch(
        `${REST_API_BASE_URL}/wingerx/notifications/configuration`,
        { credentials: 'include' },
      );

      if (!response.ok) throw new Error(await parseError(response));
      setConfiguration(
        (await response.json()) as WingerXNotificationConfiguration,
      );
    } finally {
      setIsLoadingConfiguration(false);
    }
  }, []);

  useEffect(() => {
    void loadConfiguration().catch(() => setConfiguration(null));
  }, [loadConfiguration]);

  const post = useCallback(
    async (channel: 'email' | 'whatsapp', body: EmailInput | WhatsAppInput) => {
      setIsSending(true);
      try {
        const response = await fetch(
          `${REST_API_BASE_URL}/wingerx/notifications/${channel}`,
          {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...body,
              idempotencyKey: crypto.randomUUID(),
            }),
          },
        );

        if (!response.ok) throw new Error(await parseError(response));

        return (await response.json()) as WingerXNotificationResult;
      } finally {
        setIsSending(false);
      }
    },
    [],
  );

  const sendEmail = useCallback(
    (input: EmailInput) => post('email', input),
    [post],
  );
  const sendWhatsApp = useCallback(
    (input: WhatsAppInput) => post('whatsapp', input),
    [post],
  );

  return {
    configuration,
    isLoadingConfiguration,
    isSending,
    reloadConfiguration: loadConfiguration,
    sendEmail,
    sendWhatsApp,
  };
};
