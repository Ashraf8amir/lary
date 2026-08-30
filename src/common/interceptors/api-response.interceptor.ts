import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { RESPONSE_MESSAGE_KEY } from '../decorators/response-message.decorator';
import { ApiResponse, isResponseEnvelope } from '../interfaces/api-response.interface';

@Injectable()
export class ApiResponseInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler<T>): Observable<ApiResponse<T>> {
    const response = context.switchToHttp().getResponse();

    const message =
      this.reflector.getAllAndOverride<string>(RESPONSE_MESSAGE_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? 'Request successful';

    return next.handle().pipe(
      map((result): ApiResponse<T> => {
        const statusCode = response.statusCode ?? 200;
        const timestamp = new Date().toISOString();

        if (isResponseEnvelope<T>(result)) {
          return {
            success: true,
            statusCode,
            message,
            data: (result.data ?? null) as T,
            metadata: result.metadata,
            timestamp,
          };
        }

        return {
          success: true,
          statusCode,
          message,
          data: (result ?? null) as T,
          timestamp,
        };
      }),
    );
  }
}
