import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateOfficeTable1712000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'office',
        columns: [
          {
            name: 'id',
            type: 'bigint',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'name',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'whatsapp',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'telegram',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'first_deposit_bonus',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'perpetual_bonus',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'min_deposit',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'min_withdrawal',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'min_withdrawal_wait',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'varchar',
            isNullable: false,
            default: "'active'",
          },
          {
            name: 'created_at',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP(6)',
          },
          {
            name: 'updated_at',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP(6)',
          },
        ],
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('office');
  }
} 