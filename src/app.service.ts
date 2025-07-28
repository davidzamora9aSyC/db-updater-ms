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
}
