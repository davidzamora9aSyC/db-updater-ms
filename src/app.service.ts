import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }
  saveEvento(body: any) {
    // Aquí luego se implementará el guardado en la base de datos
    console.log('Evento recibido:', body);
  }

  saveImpacto(body: any) {
    // Aquí luego se implementará el guardado en la base de datos
    console.log('Impacto recibido:', body);
  }

  saveMinuta(body: any) {
    // Aquí luego se implementará el guardado en la base de datos
    console.log('Minuta recibida:', body);
  }

  getColombiaTime() {
    const timeZone = 'America/Bogota';
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      hour12: false,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    const parts = formatter.formatToParts(new Date()).reduce(
      (acc, part) => {
        if (part.type !== 'literal') {
          acc[part.type] = part.value;
        }
        return acc;
      },
      {} as Record<string, string>,
    );

    const dateTime = `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}`;

    return {
      timeZone,
      dateTime,
    };
  }
}
