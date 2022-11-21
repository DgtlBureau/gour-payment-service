import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class PaymentCreateResponseDto {
  @IsBoolean()
  success: SuccessOrFailBool;

  @IsNumber()
  @IsOptional()
  transactionId: UniqueIdNumber;

  errorMessage: ErrorString;

  acsUrl: URIString;

  paReq: TokenString;
}
