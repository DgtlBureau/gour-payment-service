import { Injectable } from '@nestjs/common';
import { JwtService as NestJwtService } from '@nestjs/jwt';
import { IJwtService } from '../@types/services-implementation';

@Injectable()
export class JwtService implements IJwtService {
  constructor(private jwtService: NestJwtService) {}
  sign(payload: Record<string, unknown>): TokenString {
    return this.jwtService.sign(payload);
  }

  verify(signature: SignatureString): boolean {
    try {
      this.jwtService.verify(signature);
      return true;
    } catch (error) {
      return false;
    }
  }
}
