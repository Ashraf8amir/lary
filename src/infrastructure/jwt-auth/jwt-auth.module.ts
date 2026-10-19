import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtAuthService } from './jwt-auth.service';
import { JwtAccessStrategy } from './strategies/jwt-access.strategy';

@Global()
@Module({
  imports: [JwtModule.register({}), PassportModule],
  providers: [JwtAuthService, JwtAccessStrategy],
  exports: [JwtAuthService],
})
export class JwtAuthModule {}
