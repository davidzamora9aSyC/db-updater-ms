import { Injectable } from '@nestjs/common';
import { CreateTrabajadorDto } from './dto/create-trabajador.dto';
import { UpdateTrabajadorDto } from './dto/update-trabajador.dto';

@Injectable()
export class TrabajadorService {
  crear(data: CreateTrabajadorDto) {
    return { mensaje: 'Trabajador creado', data };
  }

  listar() {
    return [{ id: 1, nombre: 'Ejemplo' }];
  }

  obtener(id: string) {
    return { id, nombre: 'Ejemplo' };
  }

  actualizar(id: string, data: UpdateTrabajadorDto) {
    return { mensaje: `Trabajador ${id} actualizado`, data };
  }

  cambiarEstado(id: string, estado: boolean) {
    return { mensaje: `Estado de trabajador ${id} cambiado a ${estado}` };
  }
}