import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';
import { UsersModule } from '../users/users.module';
import { AuthService } from './auth.service';
import { RefreshTokenGuard } from './guards/refresh.token.guard';
import { AuthRepository } from './repositories/auth.repository';
import { Auth, AuthSchema } from './schemas/auth.schema';
import { CredentialsService } from './services/credentials.service';
import { SessionService } from './services/session.service';
import { TokenService } from './services/token.service';
import { JwtAccessStrategy } from './strategies/jwt-access.strategy';
import { RefreshTokenStrategy } from './strategies/jwt-refresh.strategy';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Auth.name, schema: AuthSchema }]),
    JwtModule.register({}),
    PassportModule,
    UsersModule,
  ],
  controllers: [],
  providers: [
    AuthService,
    AuthRepository,
    CredentialsService,
    SessionService,
    TokenService,
    JwtAccessStrategy,
    RefreshTokenStrategy,
    RefreshTokenGuard,
  ],
  exports: [TokenService, SessionService],
})
export class AuthModule {}
