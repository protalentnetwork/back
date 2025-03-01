import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Account } from './entities/account.entity';
import { CreateAccountDto } from './dto/account.dto';

@Injectable()
export class AccountService {
  constructor(
    @InjectRepository(Account)
    private accountRepository: Repository<Account>,
  ) {}

  async findAll(): Promise<Account[]> {
    return this.accountRepository.find();
  }

  async findOne(id: number): Promise<Account> {
    const account = await this.accountRepository.findOne({ where: { id } });
    if (!account) {
      throw new NotFoundException(`Account with ID ${id} not found`);
    }
    return account;
  }

  async create(createAccountDto: CreateAccountDto): Promise<Account> {
    const newAccount = this.accountRepository.create(createAccountDto);
    return this.accountRepository.save(newAccount);
  }

  async update(id: number, updateAccountDto: Partial<CreateAccountDto>): Promise<Account> {
    const account = await this.findOne(id);
    
    // Actualizar solo los campos proporcionados
    Object.assign(account, updateAccountDto);
    
    return this.accountRepository.save(account);
  }

  async remove(id: number): Promise<void> {
    const account = await this.findOne(id);
    await this.accountRepository.remove(account);
  }

  async findAllCbus(): Promise<string[]> {
    const accounts = await this.accountRepository.find({
      select: ['cbu'],
      where: { status: 'active' } // Asumiendo que quieres solo las cuentas activas
    });
    
    return accounts.map(account => account.cbu);
  }
}