import type { User } from '../entities/User';

export interface IUserRepository {
  findOne(): Promise<User | null>;
  findById(id: string): Promise<User | null>;
}
