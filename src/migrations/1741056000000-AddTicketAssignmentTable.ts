import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class AddTicketAssignmentTable1741056000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'ticket_assignment',
                columns: [
                    {
                        name: 'id',
                        type: 'bigint',
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: 'increment',
                    },
                    {
                        name: 'ticket_id',
                        type: 'bigint',
                        isNullable: false,
                    },
                    {
                        name: 'zendesk_ticket_id',
                        type: 'varchar',
                        isNullable: false,
                    },
                    {
                        name: 'user_id',
                        type: 'bigint',
                        isNullable: false,
                    },
                    {
                        name: 'status',
                        type: 'varchar',
                        default: "'open'",
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
                        onUpdate: 'CURRENT_TIMESTAMP(6)',
                    },
                ],
            }),
            true
        );

        // Crear índices para mejorar el rendimiento
        await queryRunner.query(
            `CREATE INDEX "IDX_TICKET_ASSIGNMENT_USER_ID" ON "ticket_assignment" ("user_id")`
        );

        await queryRunner.query(
            `CREATE INDEX "IDX_TICKET_ASSIGNMENT_ZENDESK_TICKET_ID" ON "ticket_assignment" ("zendesk_ticket_id")`
        );

        // Crear clave foránea para la relación con la tabla de usuarios
        await queryRunner.createForeignKey(
            'ticket_assignment',
            new TableForeignKey({
                columnNames: ['user_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'user',
                onDelete: 'CASCADE',
            })
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Eliminar primero las claves foráneas
        const table = await queryRunner.getTable('ticket_assignment');
        const foreignKey = table.foreignKeys.find(
            (fk) => fk.columnNames.indexOf('user_id') !== -1
        );
        if (foreignKey) {
            await queryRunner.dropForeignKey('ticket_assignment', foreignKey);
        }

        // Eliminar índices
        await queryRunner.query(`DROP INDEX "IDX_TICKET_ASSIGNMENT_USER_ID"`);
        await queryRunner.query(`DROP INDEX "IDX_TICKET_ASSIGNMENT_ZENDESK_TICKET_ID"`);

        // Eliminar la tabla
        await queryRunner.dropTable('ticket_assignment');
    }
} 