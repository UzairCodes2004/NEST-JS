import { IsString, IsEmail,IsEnum, IsNotEmpty} from "class-validator";

export class CreatedUserDto{
    @IsString()
    @IsNotEmpty()
    name!: string;
    @IsEmail()
    @IsString()
    @IsNotEmpty()
    
    email!: string;
    // @IsString()
    // @IsEnum(["INTERN","ASE","SSE"], {message:'Valid role required'})
    // role!:"INTERN"|"ASE"|"SSE" ;
    @IsString()
    @IsNotEmpty()
    password!:string
}