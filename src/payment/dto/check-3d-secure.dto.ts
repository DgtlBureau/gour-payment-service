import { IsString, IsUrl } from 'class-validator';

export class Check3dSecureDto {
  @IsString()
  transactionId: UniqueIdNumber;

  @IsString()
  code: CodeString;

  @IsUrl()
  successUrl: URIString;
}
