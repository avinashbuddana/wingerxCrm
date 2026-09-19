import { Module } from '@nestjs/common';

import { WingerXNotificationController } from 'src/modules/wingerx/controllers/wingerx-notification.controller';
import { WingerXNotificationService } from 'src/modules/wingerx/services/wingerx-notification.service';

@Module({
  controllers: [WingerXNotificationController],
  providers: [WingerXNotificationService],
})
export class WingerXModule {}
