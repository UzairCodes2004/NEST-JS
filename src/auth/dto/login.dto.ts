import { IsEmail, IsNotEmpty, IsString } from "class-validator";

export class LoginTypes {
    @IsEmail()
    @IsString()
    @IsNotEmpty()
    email!: string
    @IsString()
   
    password!: string
}