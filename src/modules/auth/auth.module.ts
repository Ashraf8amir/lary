import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [JwtModule.register({}), PassportModule, UsersModule],
  controllers: [],
  providers: [],
})
export class AuthModule {}
