export interface SesionTrabajoPasoDto {
  id: string;
  sesionTrabajo: any;
  pasoOrden: any;
  cantidadAsignada: number;
  cantidadProducida: number;
  cantidadPedaleos: number;
  nombreTrabajador: string;
  nombreMaquina: string;
  estado: string;
}
