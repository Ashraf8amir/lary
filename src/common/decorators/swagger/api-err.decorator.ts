import { ApiErrorDto } from '@common/dtos/api-error.dto';
import { applyDecorators } from '@nestjs/common';
import { ApiExtraModels, ApiResponse, getSchemaPath } from '@nestjs/swagger';

interface ErrorPreset {
  status: number;
  errorCode: string;
  message: string;
  description: string;
  errors?: string[];
}

const ERROR_PRESETS: Record<string, ErrorPreset> = {
  BAD_REQUEST: {
    status: 400,
    errorCode: 'VALIDATION_ERROR',
    message: 'Invalid input parameters',
    description: 'Bad Request / Validation Error',
    errors: ['field must be a valid value'],
  },
  UNAUTHORIZED: {
    status: 401,
    errorCode: 'UNAUTHORIZED',
    message: 'Authentication credentials are missing or invalid',
    description: 'Unauthorized access',
  },
  FORBIDDEN: {
    status: 403,
    errorCode: 'FORBIDDEN',
    message: 'You do not have permission to access this resource',
    description: 'Forbidden resource',
  },
  NOT_FOUND: {
    status: 404,
    errorCode: 'RESOURCE_NOT_FOUND',
    message: 'Requested resource could not be found',
    description: 'Resource not found',
  },
  CONFLICT: {
    status: 409,
    errorCode: 'RESOURCE_CONFLICT',
    message: 'Resource already exists or state conflict occurred',
    description: 'Conflict error',
  },
  INTERNAL_SERVER_ERROR: {
    status: 500,
    errorCode: 'INTERNAL_SERVER_ERROR',
    message: 'An unexpected internal server error occurred',
    description: 'Internal server error',
  },
};

export type AppErrorType = keyof typeof ERROR_PRESETS;

export function ApiErr(errors: AppErrorType[]) {
  return applyDecorators(
    ApiExtraModels(ApiErrorDto),
    ...errors.map((errorKey) => {
      const preset = ERROR_PRESETS[errorKey];

      const examplePayload: Record<string, unknown> = {
        success: false,
        statusCode: preset.status,
        errorCode: preset.errorCode,
        message: preset.message,
        method: 'POST',
        path: '/api/v1/...',
        timestamp: '2026-10-15T18:00:00.000Z',
        requestId: 'req-c49b802a',
      };

      if (preset.errors) {
        examplePayload.errors = preset.errors;
      }

      return ApiResponse({
        status: preset.status,
        description: preset.description,
        schema: {
          allOf: [{ $ref: getSchemaPath(ApiErrorDto) }, { example: examplePayload }],
        },
      });
    }),
  );
}
