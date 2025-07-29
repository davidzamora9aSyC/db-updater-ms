import { Injectable } from '@nestjs/common';
import { DateTime } from 'luxon';

@Injectable()
export class TimezoneService {
  private readonly zone = 'America/Bogota';

  async toUTC(date: Date): Promise<Date> {
    return DateTime.fromJSDate(date, { zone: this.zone }).toJSDate();
  }

  async fromUTC(date: Date): Promise<Date> {
    return DateTime.fromJSDate(date, { zone: this.zone }).toJSDate();
  }

  async convertFromUTC(data: any): Promise<any> {
    return data;
  }
}
