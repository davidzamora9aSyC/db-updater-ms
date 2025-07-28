import { Module, Global } from '@nestjs/common';
import { TimezoneService } from './timezone.service';
import { ConfiguracionModule } from '../configuracion/configuracion.module';

@Global()
@Module({
  imports: [ConfiguracionModule],
  providers: [TimezoneService],
  exports: [TimezoneService],
})
export class TimezoneModule {}
