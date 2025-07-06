import { Injectable } from '@nestjs/common'

@Injectable()
export class BotonService {
  registrarDescanso() {
    return { mensaje: 'Descanso registrado' }
  }

  registrarMantenimiento() {
    return { mensaje: 'Mantenimiento registrado' }
  }

  registrarVolver() {
    return { mensaje: 'Volver registrado' }
  }
}