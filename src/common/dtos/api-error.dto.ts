import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ApiErrorDto {
  @ApiProperty({ type: Boolean })
  success!: boolean;

  @ApiProperty({ type: Number })
  statusCode!: number;

  @ApiProperty({ type: String })
  errorCode!: string;

  @ApiProperty({ type: String })
  message!: string;

  @ApiPropertyOptional({ type: [String] })
  errors?: string[];

  @ApiProperty({ type: String })
  method!: string;

  @ApiProperty({ type: String })
  path!: string;

  @ApiProperty({ type: String })
  timestamp!: string;

  @ApiPropertyOptional({ type: String })
  requestId?: string;
}
