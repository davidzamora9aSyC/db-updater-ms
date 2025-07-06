import { Module } from '@nestjs/common';
import { RegistroMinutoService } from './registro-minuto.service';

@Module({
  providers: [RegistroMinutoService]
})
export class RegistroMinutoModule {}
