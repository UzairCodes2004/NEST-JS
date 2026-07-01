import { PartialType } from "@nestjs/mapped-types";
import { CreatedIssueDto } from "./create-issue.dto";
export class UpdateIssueDto extends PartialType(CreatedIssueDto){}