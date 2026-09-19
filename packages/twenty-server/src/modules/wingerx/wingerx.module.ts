import { Module } from '@nestjs/common';

import { AuthModule } from 'src/engine/core-modules/auth/auth.module';
import { WorkspaceCacheStorageModule } from 'src/engine/workspace-cache-storage/workspace-cache-storage.module';
import { WingerXNotificationController } from 'src/modules/wingerx/controllers/wingerx-notification.controller';
import { WingerXNotificationService } from 'src/modules/wingerx/services/wingerx-notification.service';

@Module({
  imports: [AuthModule, WorkspaceCacheStorageModule],
  controllers: [WingerXNotificationController],
  providers: [WingerXNotificationService],
})
export class WingerXModule {}
