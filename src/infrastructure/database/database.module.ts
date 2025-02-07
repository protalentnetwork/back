import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Log } from 'src/core/entities/log.entity';
import { Ticket } from 'src/core/entities/ticket.entity';
import { Transaction } from 'src/core/entities/transaction.entity';
import { User } from 'src/core/entities/user.entity';


@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'monorail.proxy.rlwy.net',
      port: 39653,
      username: 'postgres',
      password: 'lzAAAKpllvtjLLaBBNilVYBkmqUWWAXL',
      database: 'railway',
      entities: [User, Transaction, Ticket, Log], // Todas las entidades registradas
      synchronize: true, // cambiar a false para consistencia de datos.
      ssl: {
        rejectUnauthorized: false,
      },
    }),
  ],
})
export class DatabaseModule {}