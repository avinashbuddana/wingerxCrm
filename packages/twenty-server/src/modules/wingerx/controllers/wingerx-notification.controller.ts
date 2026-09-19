import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';

import { ApiPath } from 'twenty-shared/types';

import { getWorkspaceAuthContext } from 'src/engine/core-modules/auth/storage/workspace-auth-context.storage';
import { JwtAuthGuard } from 'src/engine/guards/jwt-auth.guard';
import { NoPermissionGuard } from 'src/engine/guards/no-permission.guard';
import { WorkspaceAuthGuard } from 'src/engine/guards/workspace-auth.guard';
import { SendWingerXEmailDto } from 'src/modules/wingerx/dtos/send-wingerx-email.dto';
import { SendWingerXWhatsAppDto } from 'src/modules/wingerx/dtos/send-wingerx-whatsapp.dto';
import { WingerXNotificationService } from 'src/modules/wingerx/services/wingerx-notification.service';

@Controller(`${ApiPath.Rest}/wingerx/notifications`)
@UseGuards(JwtAuthGuard, WorkspaceAuthGuard, NoPermissionGuard)
export class WingerXNotificationController {
  constructor(
    private readonly wingerXNotificationService: WingerXNotificationService,
  ) {}

  @Get('configuration')
  getConfiguration() {
    return this.wingerXNotificationService.getConfiguration();
  }

  @Post('email')
  sendEmail(@Body() input: SendWingerXEmailDto) {
    const { workspace } = getWorkspaceAuthContext();

    return this.wingerXNotificationService.sendEmail(workspace.id, input);
  }

  @Post('whatsapp')
  sendWhatsApp(@Body() input: SendWingerXWhatsAppDto) {
    const { workspace } = getWorkspaceAuthContext();

    return this.wingerXNotificationService.sendWhatsApp(workspace.id, input);
  }
}
