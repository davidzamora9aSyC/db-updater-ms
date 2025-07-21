import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { RegistroMinutoService } from './registro-minuto.service'
import { RegistroMinuto } from './registro-minuto.entity'
import { RegistroMinutoController } from './registro-minuto.controller'


@Module({
  imports: [TypeOrmModule.forFeature([RegistroMinuto])],
  providers: [RegistroMinutoService],
  controllers: [RegistroMinutoController],
})
export class RegistroMinutoModule {}
