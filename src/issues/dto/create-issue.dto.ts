
import { IsString, IsEnum, IsNotEmpty } from "class-validator";
export class CreatedIssueDto{

@IsString()
@IsNotEmpty()
title!:string;

@IsString()
@IsNotEmpty()
description!:string



// USED WHEN USER IS PROVIDING THE STATUSES BUT HERE WE HAVE DEFAULT VALUE FOR LL STATUS OPEN

// @IsString()
// @IsEnum(["OPEN","CLOSED","IN_PROGRESS"], {message:"Valid role required"})
// status!:"OPEN"|"CLOSED"|"IN_PROGRESS"
}