import { Controller, Get } from '@nestjs/common';
import { TimezoneService } from './timezone.service';

@Controller()
export class TimezoneController {
  constructor(private readonly timezoneService: TimezoneService) {}

  @Get('hora-colombia')
  getColombiaTime() {
    return this.timezoneService.getCurrentColombiaTime();
  }
}
