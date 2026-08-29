import { LOGGER_CONSTANTS } from '../../constants/logger.constants';
import { LogInfo } from '../../interfaces/logger.interface';

export function buildSlackPayload(info: LogInfo): object {
  const requestId =
    info.requestId || (typeof info.message === 'object' ? info.message.requestId : null) || 'N/A';

  const safeMessage =
    typeof info.message === 'string' ? info.message : JSON.stringify(info.message);

  const safeTime = new Date(info.timestamp || Date.now()).toLocaleString('en-US', {
    timeZone: 'Africa/Cairo',
    dateStyle: 'medium',
    timeStyle: 'medium',
  });

  const stack = info.stack || null;
  const stackStr = Array.isArray(stack) ? stack.join('\n') : String(stack || '');
  const { STACK_TRACE_MAX_LENGTH } = LOGGER_CONSTANTS.SLACK;

  return {
    attachments: [
      {
        color: '#E01E5A',
        blocks: [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: `🚨 ${LOGGER_CONSTANTS.APP_NAME} Server Error`,
              emoji: true,
            },
          },
          {
            type: 'section',
            fields: [
              { type: 'mrkdwn', text: `*Request ID:*\n\`${requestId}\`` },
              { type: 'mrkdwn', text: `*Time:*\n${safeTime}` },
            ],
          },
          {
            type: 'section',
            text: { type: 'mrkdwn', text: `*Message:*\n\`\`\`${safeMessage}\`\`\`` },
          },
          ...(stack
            ? [
                {
                  type: 'section',
                  text: {
                    type: 'mrkdwn',
                    text: `*Stack Trace:*\n\`\`\`${stackStr.substring(0, STACK_TRACE_MAX_LENGTH)}\`\`\``,
                  },
                },
              ]
            : []),
        ],
      },
    ],
  };
}
