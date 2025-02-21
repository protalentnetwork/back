import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialMigration1700000000000 implements MigrationInterface {
    name = 'InitialMigration1700000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create User table
        await queryRunner.query(`
            CREATE TABLE "user" (
                "id" BIGSERIAL NOT NULL,
                "username" character varying NOT NULL,
                "email" character varying NOT NULL UNIQUE,
                "role" character varying NOT NULL,
                "status" character varying NOT NULL DEFAULT 'active',
                "office" character varying NOT NULL,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                "withdrawal" character varying NOT NULL DEFAULT 'enabled',
                "last_login_date" TIMESTAMP WITH TIME ZONE,
                "last_logout_date" TIMESTAMP WITH TIME ZONE,
                "phone_number" character varying,
                "description" text,
                CONSTRAINT "PK_user" PRIMARY KEY ("id")
            )
        `);

        // Create Account table
        await queryRunner.query(`
            CREATE TABLE "account" (
                "id" BIGSERIAL NOT NULL,
                "office" character varying NOT NULL,
                "wallet" character varying NOT NULL,
                "name" character varying NOT NULL,
                "alias" character varying NOT NULL,
                "cbu" character varying NOT NULL,
                "operator" character varying NOT NULL,
                "agent" character varying NOT NULL,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                "status" character varying NOT NULL DEFAULT 'active',
                "mp_access_token" character varying,
                "mp_public_key" character varying,
                "mp_client_id" character varying,
                "mp_client_secret" character varying,
                CONSTRAINT "PK_account" PRIMARY KEY ("id")
            )
        `);

        // Create Chat table
        await queryRunner.query(`
            CREATE TABLE "chat" (
                "id" BIGSERIAL NOT NULL,
                "user_id" character varying NOT NULL,
                "message" character varying NOT NULL,
                "sender" character varying NOT NULL,
                "agent_id" character varying,
                "timestamp" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                CONSTRAINT "PK_chat" PRIMARY KEY ("id")
            )
        `);

        // Create Transaction table
        await queryRunner.query(`
            CREATE TABLE "transaction" (
                "id" BIGSERIAL NOT NULL,
                "amount" decimal(10,2) NOT NULL,
                "status" character varying NOT NULL,
                "type" character varying NOT NULL,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                "user_id" bigint,
                CONSTRAINT "PK_transaction" PRIMARY KEY ("id"),
                CONSTRAINT "FK_transaction_user" FOREIGN KEY ("user_id") REFERENCES "user"("id")
            )
        `);

        // Create Log table
        await queryRunner.query(`
            CREATE TABLE "log" (
                "id" BIGSERIAL NOT NULL,
                "action" character varying NOT NULL,
                "date" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "result" character varying NOT NULL,
                "user_id" bigint,
                CONSTRAINT "PK_log" PRIMARY KEY ("id"),
                CONSTRAINT "FK_log_user" FOREIGN KEY ("user_id") REFERENCES "user"("id")
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "log"`);
        await queryRunner.query(`DROP TABLE "transaction"`);
        await queryRunner.query(`DROP TABLE "chat"`);
        await queryRunner.query(`DROP TABLE "account"`);
        await queryRunner.query(`DROP TABLE "user"`);
    }
} 