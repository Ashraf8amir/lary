import { PickType } from '@nestjs/mapped-types';
import { CreateStoreMemberDto } from './create-store-member.dto';

export class UpdateStoreMemberDto extends PickType(CreateStoreMemberDto, ['role'] as const) {}
