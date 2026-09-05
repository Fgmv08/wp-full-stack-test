import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'first_name', type: 'varchar', length: 100 })
  firstName!: string;

  @Column({ name: 'last_name', type: 'varchar', length: 100 })
  lastName!: string;

  @Column({ unique: true, type: 'varchar', length: 255 })
  email!: string;

  @Column({ type: 'varchar', length: 20 })
  phone!: string;

  @Column({ name: 'id_type', type: 'varchar', length: 10 })
  idType!: string;

  @Column({ name: 'id_number', type: 'varchar', length: 20 })
  idNumber!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
