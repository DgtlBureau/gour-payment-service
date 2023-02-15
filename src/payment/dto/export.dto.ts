import { IsDateString, IsOptional } from 'class-validator';

export class ExportDto {
  @IsDateString()
  @IsOptional()
  start?: string;

  @IsDateString()
  @IsOptional()
  end?: string;
}
