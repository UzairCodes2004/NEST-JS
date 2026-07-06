import { IsEmail, IsString, IsNotEmpty } from "class-validator";

export class ResetPasswordDto {
    @IsEmail()
    @IsNotEmpty()
    email!: string;

    @IsString()
    @IsNotEmpty()
    token!: string
    @IsNotEmpty()
    newPassword!: string

}