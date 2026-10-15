import { ApiProperty } from '@nestjs/swagger';
import { EmbeddedNextStep } from '../enums/salla-embedded.enum';

export class StatusResponseDto {
  @ApiProperty({ example: true })
  connected!: boolean;

  @ApiProperty({ example: 'connected', nullable: true })
  status!: string | null;

  @ApiProperty({ example: '2023-09-01T12:34:56Z' })
  connectedAt?: string;

  @ApiProperty({ example: '2023-09-01T12:34:56Z' })
  lastSyncAt?: string;

  @ApiProperty({ example: '2023-09-01T12:34:56Z' })
  lastRefreshedAt?: string;

  @ApiProperty({ example: ['read_products', 'write_orders'] })
  scopes?: string[];
}

export class embeddedSessionResponseDto {
  @ApiProperty({
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
  })
  accessToken!: string;

  @ApiProperty({ example: '2023-09-01T12:34:56Z' })
  accessTokenExpiresAt!: string;

  @ApiProperty({ enum: EmbeddedNextStep, example: EmbeddedNextStep.CompleteOnboarding })
  nextStep!: string;
}
