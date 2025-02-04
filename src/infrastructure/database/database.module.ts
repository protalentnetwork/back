import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/core/entities/user.entity';

@Module({
    imports: [
        TypeOrmModule.forRoot({
            type: 'postgres',
            url: 'postgresql://postgres:lzAAAKpllvtjLLaBBNilVYBkmqUWWAXL@monorail.proxy.rlwy.net:39653/railway',
            entities: [User],
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