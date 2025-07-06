import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { RegistroMinutoService } from './registro-minuto.service'
import { RegistroMinuto } from './registro-minuto.entity'

@Module({
  imports: [TypeOrmModule.forFeature([RegistroMinuto])],
  providers: [RegistroMinutoService],
})
export class RegistroMinutoModule {}
