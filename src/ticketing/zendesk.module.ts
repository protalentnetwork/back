import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ZendeskController } from './zendesk.controller';
import { ZendeskService } from './zendesk.service';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [HttpModule, AuthModule],
    controllers: [ZendeskController],
    providers: [ZendeskService],
    exports: [ZendeskService],
})
export class ZendeskModule { }
