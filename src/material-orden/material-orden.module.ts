import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MaterialOrden } from './material-orden.entity';
import { MaterialOrdenService } from './material-orden.service';
import { MaterialOrdenController } from './material-orden.controller';

@Module({
  imports: [TypeOrmModule.forFeature([MaterialOrden])],
  providers: [MaterialOrdenService],
  controllers: [MaterialOrdenController],
})
export class MaterialOrdenModule {}
