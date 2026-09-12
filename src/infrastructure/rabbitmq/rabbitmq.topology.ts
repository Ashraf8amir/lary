import { DomainConfig } from './rabbitmq.domains.config';

export const GLOBAL_DLX = 'app.dlx';

export interface GeneratedExchange {
  name: string;
  type: 'topic' | 'fanout' | 'direct';
}

export interface GeneratedQueue {
  name: string;
  exchange: string;
  routingKey: string;
  options: Record<string, unknown>;
}

export interface EventRoute {
  domain: string;
  exchange: string;
  routingKey: string;
  queueName: string;
  retryDelaysMs: number[];
}

export interface RabbitMqTopology {
  exchanges: GeneratedExchange[];
  queues: GeneratedQueue[];
  eventIndex: Record<string, EventRoute>;
}

export function buildRabbitMqTopology(domains: DomainConfig[]): RabbitMqTopology {
  const exchanges: GeneratedExchange[] = [{ name: GLOBAL_DLX, type: 'direct' }];
  const queues: GeneratedQueue[] = [];
  const eventIndex: Record<string, EventRoute> = {};

  for (const domainConfig of domains) {
    exchanges.push({ name: domainConfig.exchange, type: 'topic' });

    for (const delayMs of domainConfig.retryDelaysMs) {
      const retryExchange = `${domainConfig.domain}.retry.${delayMs}`;
      exchanges.push({ name: retryExchange, type: 'fanout' });

      queues.push({
        name: retryExchange,
        exchange: retryExchange,
        routingKey: '',
        options: {
          durable: true,
          messageTtl: delayMs,
          deadLetterExchange: domainConfig.exchange,
        },
      });
    }

    for (const eventConfig of domainConfig.events) {
      const dlqRoutingKey = `${eventConfig.routingKey}.dlq`;

      queues.push({
        name: eventConfig.queueName,
        exchange: domainConfig.exchange,
        routingKey: eventConfig.routingKey,
        options: {
          durable: true,
          deadLetterExchange: GLOBAL_DLX,
          deadLetterRoutingKey: dlqRoutingKey,
        },
      });

      queues.push({
        name: `${eventConfig.queueName}.dlq`,
        exchange: GLOBAL_DLX,
        routingKey: dlqRoutingKey,
        options: { durable: true },
      });

      eventIndex[eventConfig.event] = {
        domain: domainConfig.domain,
        exchange: domainConfig.exchange,
        routingKey: eventConfig.routingKey,
        queueName: eventConfig.queueName,
        retryDelaysMs: domainConfig.retryDelaysMs,
      };
    }
  }

  return { exchanges, queues, eventIndex };
}
