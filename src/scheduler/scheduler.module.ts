import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { EtlModule } from '../etl/etl.module';
import { PollService } from './poll.service';

@Module({
  imports: [ScheduleModule.forRoot(), EtlModule],
  providers: [PollService],
  exports: [PollService],
})
export class SchedulerModule {}
