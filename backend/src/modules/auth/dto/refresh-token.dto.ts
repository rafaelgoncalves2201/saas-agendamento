import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty({ description: 'Refresh token para renovação do access token' })
  @IsString()
  @IsNotEmpty({ message: 'O refresh token é obrigatório' })
  refreshToken: string;
}

