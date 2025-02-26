import { Module } from '@nestjs/common';
import { IpnController } from './transactions.controller';
import { IpnService } from './transactions.service';

@Module({
    controllers: [IpnController],
    providers: [IpnService],
})
export class IpnModule { }