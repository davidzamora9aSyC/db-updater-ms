import { Module, Global } from '@nestjs/common';
import { TimezoneService } from './timezone.service';
import { TimezoneController } from './timezone.controller';

@Global()
@Module({
  controllers: [TimezoneController],
  providers: [TimezoneService],
  exports: [TimezoneService],
})
export class TimezoneModule {}
