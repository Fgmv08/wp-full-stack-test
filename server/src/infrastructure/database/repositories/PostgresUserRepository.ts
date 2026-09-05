import type { IUserRepository } from '@domain/ports/IUserRepository';
import type { User } from '@domain/entities/User';
import type { DataSource } from 'typeorm';
import { UserEntity } from '../entities/UserEntity';

export class PostgresUserRepository implements IUserRepository {
  private readonly repo;

  constructor(dataSource: DataSource) {
    this.repo = dataSource.getRepository(UserEntity);
  }

  private toUser(entity: UserEntity): User {
    return {
      id: entity.id,
      firstName: entity.firstName,
      lastName: entity.lastName,
      email: entity.email,
      phone: entity.phone,
      idType: entity.idType,
      idNumber: entity.idNumber,
      createdAt: entity.createdAt,
    };
  }

  async findOne(): Promise<User | null> {
    const entity = await this.repo.findOne({ where: {} });
    return entity ? this.toUser(entity) : null;
  }

  async findById(id: string): Promise<User | null> {
    const entity = await this.repo.findOneBy({ id });
    return entity ? this.toUser(entity) : null;
  }
}
