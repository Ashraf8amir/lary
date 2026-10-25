import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { ApiRes } from '@/common/decorators/swagger';
import { ApiErr } from '@/common/decorators/swagger/api-err.decorator';
import { ResponseMessage } from '@common';
import { Controller, Get, HttpCode, HttpStatus, Param, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { DashboardService } from './dashboard.service';
import { BillingResponseDto } from './dtos/billing-response.dto';
import { ChatMessagesQueryDto, ChatPaginationQueryDto } from './dtos/chat-pagination.dto';
import { ChatSummaryResponseDto } from './dtos/chat-response.dto';
import { OverviewResponseDto } from './dtos/overview-response.dto';

@ApiTags('Dashboard')
@ApiErr(['INTERNAL_SERVER_ERROR'])
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Throttle({ short: { limit: 10, ttl: 10000 }, long: { limit: 60, ttl: 60000 } })
  @Get('billing')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Billing information retrieved')
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Get billing and plan information for the current store',
    description:
      'Retrieves billing, subscription, plan, usage, and product information for the current store.',
  })
  @ApiRes(BillingResponseDto, { status: HttpStatus.OK })
  @ApiErr(['NOT_FOUND'])
  async getBilling(@CurrentUser('storeId') storeId: string) {
    return this.dashboardService.getBilling(storeId);
  }

  @Throttle({ short: { limit: 10, ttl: 10000 }, long: { limit: 60, ttl: 60000 } })
  @Get('overview')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Overview information retrieved')
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Get overview information for the current store',
    description:
      'Retrieves an overview of the current store, including key metrics and performance indicators.',
  })
  @ApiRes(OverviewResponseDto, { status: HttpStatus.OK })
  @ApiErr(['NOT_FOUND'])
  async getOverview(@CurrentUser('storeId') storeId: string) {
    return this.dashboardService.getOverview(storeId);
  }

  @Throttle({ short: { limit: 10, ttl: 10000 }, long: { limit: 60, ttl: 60000 } })
  @Get('chat')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Chat history retrieved')
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Get chat conversations summary for the current store',
    description: 'Retrieves a summary of chat conversations for the current store.',
  })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiRes(ChatSummaryResponseDto, { status: HttpStatus.OK })
  @ApiErr(['BAD_REQUEST'])
  async getChatSummary(
    @CurrentUser('storeId') storeId: string,
    @Query() query: ChatPaginationQueryDto,
  ) {
    return this.dashboardService.getChatSummary(storeId, query.limit ?? 20, query.skip ?? 0);
  }

  @Throttle({ short: { limit: 10, ttl: 10000 }, long: { limit: 60, ttl: 60000 } })
  @Get('chat/:conversationId')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Chat conversation retrieved')
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Get a single chat conversation with messages',
    description: 'Retrieves a single chat conversation with its messages for the current store.',
  })
  @ApiParam({ name: 'conversationId', required: true })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiRes(ChatSummaryResponseDto, { status: HttpStatus.OK })
  @ApiErr(['BAD_REQUEST'])
  async getChatConversation(
    @CurrentUser('storeId') storeId: string,
    @Param('conversationId') conversationId: string,
    @Query() query: ChatMessagesQueryDto,
  ) {
    return this.dashboardService.getChatConversation(
      storeId,
      conversationId,
      query.limit ?? 100,
      query.skip ?? 0,
    );
  }
}
