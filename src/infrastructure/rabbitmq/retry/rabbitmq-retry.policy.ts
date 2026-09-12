import { Injectable } from '@nestjs/common';

import { DOMAINS } from '../rabbitmq.domains.config';
import { buildRabbitMqTopology } from '../rabbitmq.topology';

export interface RetryDecision {
  shouldRetry: boolean;
  nextAttempt?: number;
  retryExchange?: string;
  originalRoutingKey?: string;
}

const { eventIndex } = buildRabbitMqTopology(DOMAINS);

@Injectable()
export class RabbitMqRetryPolicy {
  decide(event: string, currentAttempt: number): RetryDecision {
    const route = eventIndex[event];
    if (!route) {
      return { shouldRetry: false };
    }

    const nextAttempt = currentAttempt + 1;
    const delayIndex = nextAttempt - 2;

    if (delayIndex < 0 || delayIndex >= route.retryDelaysMs.length) {
      return { shouldRetry: false };
    }

    const delayMs = route.retryDelaysMs[delayIndex];

    return {
      shouldRetry: true,
      nextAttempt,
      retryExchange: `${route.domain}.retry.${delayMs}`,
      originalRoutingKey: route.routingKey,
    };
  }
}
