import { PartialType } from '@nestjs/mapped-types';
import { CreateManagerRequestDto } from './create-manager-request.dto';

export class UpdateManagerRequestDto extends PartialType(CreateManagerRequestDto) {}
