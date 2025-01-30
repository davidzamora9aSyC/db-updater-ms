import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  printJson(body: any) {
    console.log(body);
  }
}
