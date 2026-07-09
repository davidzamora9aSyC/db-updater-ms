export interface SesionTrabajoPasoDto {
  id: string;
  sesionTrabajo: any;
  pasoOrden: any;
  cantidadAsignada: number;
  cantidadProducida: number;
  cantidadPedaleos: number;
  comentarioDefectuosas?: string | null;
  estado: string;
  finalizado: boolean;
  finalizadoEn?: string | Date | null;
}
