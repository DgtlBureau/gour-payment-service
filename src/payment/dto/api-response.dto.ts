import { IsBoolean } from 'class-validator';

export class PaymentApiResponseDto {
  @IsBoolean()
  Success: SuccessOrFailBool;

  Message: ErrorString;

  Model: {
    TransactionId: UniqueIdNumber;
    AcsUrl: URIString;
    PaReq: TokenString;
  };
}
