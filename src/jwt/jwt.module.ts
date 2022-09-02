import { Module } from '@nestjs/common';
import { JwtService } from './jwt.service';
import { JwtModule as NestJwtModule } from '@nestjs/jwt';

@Module({
  imports: [NestJwtModule],
  providers: [JwtService],
})
export class JwtModule {}
