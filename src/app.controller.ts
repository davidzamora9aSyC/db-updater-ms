import { Controller, Post, Body } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Post('print-json')
  printJson(@Body() body: any) {
    this.appService.printJson(body);
    return { message: 'JSON recibido' };
  }
}
