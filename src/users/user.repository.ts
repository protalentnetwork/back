import { EntityRepository, Repository } from 'typeorm';
import { User } from './entities/user.entity';

@EntityRepository(User) // Especifica la entidad que maneja este repositorio
export class UserRepository extends Repository<User> {
    // Puedes añadir métodos personalizados para consultas a la base de datos
}