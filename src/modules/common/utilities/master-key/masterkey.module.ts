import { Module } from '@nestjs/common';
import { MasterKeyService } from './masterkey.service';
import { MasterKeyEntity } from './entities/masterkey.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MasterKeyController } from './masterkey.controller';
import { SlackModule } from '@/common/slack/slack.module';

@Module({
  imports: [TypeOrmModule.forFeature([MasterKeyEntity]), SlackModule],
  controllers: [MasterKeyController],
  providers: [MasterKeyService],
  exports: [MasterKeyService],
})
export class MasterKeyModule {}
