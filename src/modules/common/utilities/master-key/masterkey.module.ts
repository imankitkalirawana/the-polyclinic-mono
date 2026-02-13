import { Module } from '@nestjs/common';
import { MasterKeyService } from './masterkey.service';
import { MasterKeySchema } from './schemas/masterkey.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { MasterKey } from './schemas/masterkey.schema';
import { SlackModule } from '@common/slack/slack.module';

@Module({
  imports: [
    SlackModule,
    MongooseModule.forFeature([
      { name: MasterKey.name, schema: MasterKeySchema },
    ]),
  ],
  providers: [MasterKeyService],
  exports: [MasterKeyService],
})
export class MasterKeyModule {}
