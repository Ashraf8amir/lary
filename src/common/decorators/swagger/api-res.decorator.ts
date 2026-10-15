import { ApiResponseDto, PaginationMetaDto, ResponseMetaDto } from '@common/dtos/api-response.dto';
import { applyDecorators, Type } from '@nestjs/common';
import { ApiExtraModels, ApiResponse, getSchemaPath } from '@nestjs/swagger';

interface ApiResOptions {
  isArray?: boolean;
  isPaginated?: boolean;
  status?: number;
  description?: string;
}

export const ApiRes = <TModel extends Type<any>>(model: TModel, options?: ApiResOptions) => {
  const statusCode = options?.status || 200;

  const additionalProperties: Record<string, any> = {
    statusCode: { type: 'number', example: statusCode },
    data: options?.isArray
      ? { type: 'array', items: { $ref: getSchemaPath(model) } }
      : { $ref: getSchemaPath(model) },
  };

  if (options?.isPaginated) {
    additionalProperties.metadata = {
      type: 'object',
      properties: { pagination: { $ref: getSchemaPath(PaginationMetaDto) } },
    };
  }

  const extraModels: Type<any>[] = [ApiResponseDto, model];
  if (options?.isPaginated) {
    extraModels.push(ResponseMetaDto, PaginationMetaDto);
  }

  return applyDecorators(
    ApiExtraModels(...extraModels),
    ApiResponse({
      status: statusCode,
      description: options?.description || 'Successful response',
      schema: {
        allOf: [{ $ref: getSchemaPath(ApiResponseDto) }, { properties: additionalProperties }],
      },
    }),
  );
};
