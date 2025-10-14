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

  getCurrentColombiaTime() {
    const now = DateTime.now().setZone(this.zone);

    return {
      timeZone: this.zone,
      dateTime: now.toFormat("yyyy-LL-dd'T'HH:mm:ss"),
    };
  }
}
