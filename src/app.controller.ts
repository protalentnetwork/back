import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {

    @Get('/')
    getHealtCheck() {
        return {
            status: 'ok',
        }
    }

}
