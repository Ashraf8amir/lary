import { ApiHideProperty, ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PaginationMetaDto {
  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 10 })
  limit!: number;

  @ApiProperty({ example: 100 })
  total!: number;

  @ApiProperty({ example: 10 })
  totalPages!: number;

  @ApiPropertyOptional({ example: true })
  hasNextPage?: boolean;

  @ApiPropertyOptional({ example: false })
  hasPrevPage?: boolean;
}

export class ResponseMetaDto {
  @ApiPropertyOptional({ type: () => PaginationMetaDto })
  pagination?: PaginationMetaDto;
}

export class ApiResponseDto<T> {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ example: 200 })
  statusCode!: number;

  @ApiProperty({ example: 'Operation completed successfully' })
  message!: string;

  @ApiHideProperty()
  data!: T;

  @ApiHideProperty()
  metadata?: ResponseMetaDto;

  @ApiProperty({ example: '2026-10-15T18:00:00.000Z' })
  timestamp!: string;
}
