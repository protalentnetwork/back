import { MigrationInterface, QueryRunner } from "typeorm";

export class ApiKeyTable1709007658000 implements MigrationInterface {
    name = 'ApiKeyTable1709007658000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "api_keys" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying(100) NOT NULL,
                "keyHash" character varying(64) NOT NULL,
                "isActive" boolean NOT NULL DEFAULT true,
                "permissions" text NOT NULL,
                "description" character varying,
                "clientName" character varying,
                "expiresAt" TIMESTAMP,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_name" UNIQUE ("name"),
                CONSTRAINT "PK_api_keys" PRIMARY KEY ("id")
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "api_keys"`);
    }
} 