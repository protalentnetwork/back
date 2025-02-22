import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Account } from './entities/account.entity';

@Injectable()
export class AccountService {
  constructor(
    @InjectRepository(Account)
    private accountRepository: Repository<Account>,
  ) {}

  async findAllCbus(): Promise<string[]> {
    const accounts = await this.accountRepository.find({
      select: ['cbu'],
      where: { status: 'active' } // Asumiendo que quieres solo las cuentas activas
    });
    
    return accounts.map(account => account.cbu);
  }

}