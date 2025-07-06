import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { RecursoController } from './recurso.controller'
import { RecursoService } from './recurso.service'
import { Recurso } from './recurso.entity'

@Module({
  imports: [TypeOrmModule.forFeature([Recurso])],
  controllers: [RecursoController],
  providers: [RecursoService],
})
export class RecursoModule {}