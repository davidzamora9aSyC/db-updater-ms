import { IsUUID, IsDateString, IsNumber } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class CreateRegistroMinutoDto {
  @ApiProperty({ description: 'ID de la sesión de trabajo', format: 'uuid' })
  @IsUUID()
  sesionTrabajo: string

  @ApiProperty({ description: 'ID del paso en sesión', format: 'uuid' })
  @IsUUID()
  pasoSesionTrabajo: string

  @ApiProperty({ description: 'Minuto de inicio', type: String, format: 'date-time', example: '2025-09-04T14:30:00.000Z' })
  @IsDateString()
  minutoInicio: string

  @ApiProperty({ description: 'Cantidad de pedaleadas', example: 25 })
  @IsNumber()
  pedaleadas: number

  @ApiProperty({ description: 'Cantidad de piezas contadas', example: 20 })
  @IsNumber()
  piezasContadas: number
}
