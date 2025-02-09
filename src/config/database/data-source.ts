import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { User } from '../../users/entities/user.entity';
import { Transaction } from '../../payment/entities/transaction.entity';
import { Ticket } from '../../payment/entities/ticket.entity';
import { Log } from '../../payment/entities/log.entity';

dotenv.config();

const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    entities: [User, Transaction, Ticket, Log],
    migrations: ['src/migrations/*.ts'],
    synchronize: false,
});

export default dataSource; 