import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSetup1709161234567 implements MigrationInterface {
    name = 'InitialSetup1709161234567'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Crear secuencia para user_id
        await queryRunner.query(`CREATE SEQUENCE IF NOT EXISTS user_id_seq START 1`);

        // Crear tabla user
        await queryRunner.query(`
            CREATE TABLE "user" (
                "id" bigint DEFAULT nextval('user_id_seq') PRIMARY KEY,
                "username" character varying NOT NULL,
                "email" character varying NOT NULL UNIQUE,
                "role" character varying NOT NULL,
                "status" character varying NOT NULL,
                "office" character varying NOT NULL,
                "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP(6),
                "withdrawal" character varying NOT NULL
            )
        `);

        // Crear índices
        await queryRunner.query(`CREATE INDEX "IDX_user_email" ON "user" ("email")`);
        await queryRunner.query(`CREATE INDEX "IDX_user_username" ON "user" ("username")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Eliminar índices
        await queryRunner.query(`DROP INDEX "IDX_user_username"`);
        await queryRunner.query(`DROP INDEX "IDX_user_email"`);

        // Eliminar tabla
        await queryRunner.query(`DROP TABLE "user"`);

        // Eliminar secuencia
        await queryRunner.query(`DROP SEQUENCE user_id_seq`);
    }
} 