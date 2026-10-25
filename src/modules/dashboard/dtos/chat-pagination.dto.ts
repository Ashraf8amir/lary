import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, Max, Min } from 'class-validator';
import {
  DASHBOARD_CHAT_CONVERSATIONS_LIMIT_MAX,
  DASHBOARD_CHAT_DEFAULT_LIMIT,
  DASHBOARD_CHAT_MESSAGES_DEFAULT_LIMIT,
  DASHBOARD_CHAT_MESSAGES_LIMIT_MAX,
} from '../constants/dashboard.constants';

export class ChatPaginationQueryDto {
  @ApiPropertyOptional({ example: 20, default: DASHBOARD_CHAT_DEFAULT_LIMIT })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(DASHBOARD_CHAT_CONVERSATIONS_LIMIT_MAX)
  limit?: number = DASHBOARD_CHAT_DEFAULT_LIMIT;

  @ApiPropertyOptional({ example: 0, default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  skip?: number = 0;
}

export class ChatMessagesQueryDto {
  @ApiPropertyOptional({ example: 100, default: DASHBOARD_CHAT_MESSAGES_DEFAULT_LIMIT })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(DASHBOARD_CHAT_MESSAGES_LIMIT_MAX)
  limit?: number = DASHBOARD_CHAT_MESSAGES_DEFAULT_LIMIT;

  @ApiPropertyOptional({ example: 0, default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  skip?: number = 0;
}

