import { forwardRef, Module } from '@nestjs/common';
import { JwtService } from './jwt.service';
import { JwtModule as NestJwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { AppConfigService } from 'app.module';
import { ConfigService } from '@nestjs/config';

const jwtFactory = {
  useFactory: async (
    configService: AppConfigService,
  ): Promise<JwtModuleOptions> => ({
    secret: configService.get<string>('SIGNATURE_SECRET_KEY'),
    signOptions: {
      expiresIn: configService.get('SIGNATURE_SECRET_KEY_EXP') + 'M',
    },
  }),
  inject: [ConfigService],
};
@Module({
  imports: [NestJwtModule.registerAsync(jwtFactory)],
  providers: [JwtService],
  exports: [JwtService],
})
export class JwtModule {}
