import { Injectable } from '@nestjs/common';
import { DateTime } from 'luxon';
import { ConfiguracionService } from '../configuracion/configuracion.service';

@Injectable()
export class TimezoneService {
  constructor(private readonly configService: ConfiguracionService) {}

  async toUTC(date: Date): Promise<Date> {
    const zone = await this.configService.getZonaHoraria();
    return DateTime.fromJSDate(date, { zone }).toUTC().toJSDate();
  }

  async fromUTC(date: Date): Promise<Date> {
    const zone = await this.configService.getZonaHoraria();
    return DateTime.fromJSDate(date, { zone: 'utc' }).setZone(zone).toJSDate();
  }

  async convertFromUTC(data: any): Promise<any> {
    if (data === null || data === undefined) return data;
    if (data instanceof Date) return this.fromUTC(data);
    if (Array.isArray(data))
      return Promise.all(data.map((d) => this.convertFromUTC(d)));
    if (typeof data === 'object') {
      const entries = await Promise.all(
        Object.entries(data).map(async ([k, v]) => [
          k,
          await this.convertFromUTC(v),
        ]),
      );
      return Object.fromEntries(entries);
    }
    return data;
  }
}
