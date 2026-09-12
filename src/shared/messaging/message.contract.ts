export interface RabbitMqMessage<TPayload> {
  messageId: string;
  correlationId: string;

  event: string;
  occurredAt: string;

  attempt: number;

  payload: TPayload;
}
