import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, from } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
import { TimezoneService } from './timezone.service';

@Injectable()
export class TimezoneInterceptor implements NestInterceptor {
  constructor(private readonly tzService: TimezoneService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next
      .handle()
      .pipe(mergeMap((data) => from(this.tzService.convertFromUTC(data))));
  }
}
