import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPasswordColumn1710000000000 implements MigrationInterface {
    name = 'AddPasswordColumn1710000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "user" 
            ADD COLUMN "password" character varying NOT NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "user" 
            DROP COLUMN "password"
        `);
    }
} 