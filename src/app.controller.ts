import { Controller, Get, Post, Body } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('print-json')
  getJson2() {
    return { message: 'Petición recibida' };
  }
  @Get()
  getJson3() {
    return { message: 'Petición recibida' };
  }

  @Post('print-json')
  printJson(@Body() body: any) {
    this.appService.printJson(body);
    return { message: 'JSON recibido' };
  }
}
