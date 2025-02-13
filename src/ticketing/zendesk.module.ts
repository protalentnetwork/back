import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios'; // Importar HttpModule
import { ZendeskController } from './zendesk.controller';
import { ZendeskService } from './zendesk.service';

@Module({
    imports: [HttpModule], // Agregar HttpModule aquí
    controllers: [ZendeskController],
    providers: [ZendeskService],
    exports: [ZendeskService],
})
export class ZendeskModule { }
