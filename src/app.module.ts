import { AllExceptionsFilter } from '@common';
import { ConfigurationModule } from '@config/configuration.module';
import { BadRequestException, Module, ValidationError, ValidationPipe } from '@nestjs/common';
import { APP_FILTER, APP_PIPE } from '@nestjs/core';
import { DatabaseModule } from '@providers/mongoose/database.module';
import { ClsModule } from 'nestjs-cls';
import { v4 as uuid } from 'uuid';

@Module({
  imports: [
    ConfigurationModule,
    DatabaseModule,
    ClsModule.forRoot({
      global: true,
      middleware: {
        mount: true,
        generateId: true,
        idGenerator: (req) => (req.headers['x-request-id'] as string) ?? uuid(),
      },
    }),
  ],
  controllers: [],
  providers: [
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
        exceptionFactory: (validationErrors: ValidationError[] = []) => {
          const formatErrors = (errors: ValidationError[]): any[] => {
            return errors.map((error) => ({
              field: error.property,
              errors: error.constraints ? Object.values(error.constraints) : [],
              children: error.children?.length ? formatErrors(error.children) : undefined,
            }));
          };

          return new BadRequestException({
            message: 'Validation failed',
            errors: formatErrors(validationErrors),
          });
        },
      }),
    },
  ],
})
export class AppModule {}
