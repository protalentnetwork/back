import { MigrationInterface, QueryRunner } from "typeorm";

export class AddConversationTable1740698227264 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Crear la tabla de conversaciones
        await queryRunner.query(`
            CREATE TABLE "conversation" (
                "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
                "user_id" character varying NOT NULL,
                "agent_id" character varying,
                "title" character varying,
                "status" character varying DEFAULT 'active',
                "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP(6),
                "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP(6)
            )
        `);

        // Añadir la columna conversation_id a la tabla chat
        await queryRunner.query(`
            ALTER TABLE "chat" 
            ADD COLUMN "conversation_id" uuid
        `);

        // Crear índice para mejorar el rendimiento de las consultas
        await queryRunner.query(`
            CREATE INDEX "IDX_chat_conversation_id" ON "chat" ("conversation_id")
        `);

        // Crear la restricción de clave foránea
        await queryRunner.query(`
            ALTER TABLE "chat" 
            ADD CONSTRAINT "FK_chat_conversation" 
            FOREIGN KEY ("conversation_id") 
            REFERENCES "conversation"("id") 
            ON DELETE CASCADE
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Eliminar la restricción de clave foránea
        await queryRunner.query(`
            ALTER TABLE "chat" 
            DROP CONSTRAINT "FK_chat_conversation"
        `);

        // Eliminar el índice
        await queryRunner.query(`
            DROP INDEX "IDX_chat_conversation_id"
        `);

        // Eliminar la columna conversation_id de la tabla chat
        await queryRunner.query(`
            ALTER TABLE "chat" 
            DROP COLUMN "conversation_id"
        `);

        // Eliminar la tabla de conversaciones
        await queryRunner.query(`
            DROP TABLE "conversation"
        `);
    }

}
