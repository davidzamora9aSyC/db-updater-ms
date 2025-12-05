export interface SesionTrabajoPasoDto {
  id: string;
  sesionTrabajo: any;
  pasoOrden: any;
  cantidadAsignada: number;
  cantidadProducida: number;
  cantidadPedaleos: number;
  estado: string;
  finalizado: boolean;
  finalizadoEn?: string | Date | null;
}
