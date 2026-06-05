import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, catchError, tap, throwError } from 'rxjs';

@Injectable()
export class HttpLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');
  private readonly maxPayloadLength = 4000;

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const http = context.switchToHttp();
    const request = http.getRequest();
    const response = http.getResponse();
    const startedAt = Date.now();
    const method = request.method;
    const url = request.originalUrl || request.url;
    const esp32 = request.query?.esp32 === 'true';
    const body = this.safePayload(request.body);

    this.logger.log(
      `REQ ${method} ${url} esp32=${esp32} body=${body}`,
    );

    return next.handle().pipe(
      tap((responseBody) => {
        const durationMs = Date.now() - startedAt;
        this.logger.log(
          `RES ${method} ${url} status=${response.statusCode} durationMs=${durationMs} esp32=${esp32} body=${this.safePayload(responseBody)}`,
        );
      }),
      catchError((error) => {
        const durationMs = Date.now() - startedAt;
        const status = error?.status || error?.response?.statusCode || 500;
        const errorBody = error?.response || {
          message: error?.message || 'Internal server error',
        };

        this.logger.error(
          `ERR ${method} ${url} status=${status} durationMs=${durationMs} esp32=${esp32} body=${this.safePayload(errorBody)}`,
          error?.stack,
        );

        return throwError(() => error);
      }),
    );
  }

  private safePayload(payload: unknown): string {
    if (payload === undefined) return 'undefined';
    if (payload === null) return 'null';

    try {
      const seen = new WeakSet<object>();
      const serialized = JSON.stringify(payload, (_key, value) => {
        if (typeof value === 'bigint') return value.toString();
        if (typeof value === 'object' && value !== null) {
          if (seen.has(value)) return '[Circular]';
          seen.add(value);
        }
        return value;
      });

      if (!serialized) return String(payload);
      if (serialized.length <= this.maxPayloadLength) return serialized;
      return `${serialized.slice(0, this.maxPayloadLength)}...[truncated]`;
    } catch {
      return '[Unserializable payload]';
    }
  }
}
