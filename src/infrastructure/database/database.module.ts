import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Log } from 'src/core/entities/log.entity';
import { Ticket } from 'src/core/entities/ticket.entity';
import { User } from 'src/core/entities/user.entity';
import { Transaction } from 'typeorm';

@Module({
    imports: [
        TypeOrmModule.forRoot({
            type: 'postgres',
            url: 'postgresql://postgres:lzAAAKpllvtjLLaBBNilVYBkmqUWWAXL@monorail.proxy.rlwy.net:39653/railway',
            entities: [User, Transaction, Ticket, Log],
            synchronize: true,
            ssl: {
                rejectUnauthorized: false
            },
            extra: {
                ssl: {
                    rejectUnauthorized: false,
                    sslmode: 'no-verify'
                }
            }
        }),
    ],
})
export class DatabaseModule { }