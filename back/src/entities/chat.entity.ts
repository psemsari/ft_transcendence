import {  BaseEntity,
	CreateDateColumn,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
	Column,
	JoinTable,
	ManyToMany,
	OneToMany,
	ManyToOne,
	Entity,
  OneToOne,
  JoinColumn} from 'typeorm';
  import { IsBoolean, IsEmail, IsString } from 'class-validator';
  import { MemberEntity } from './member.entity';
import { MsgEntity } from './msg.entity';

  enum status {
    private,
    public,
    protected
  }

  @Entity('chat')
  export class ChatEntity extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn()
  created: Date;

  @Column()
  @IsString()
  name: string;

  @Column()
  status: number;

  @Column()
  @IsString()
  password: string;

<<<<<<< Updated upstream
  // @ManyToOne(() => MemberEntity, (members) => members.chat)
  // members: MemberEntity[];

  @OneToMany(() => MsgEntity, (message) => message.chat)
  messages: MsgEntity[]
=======
<<<<<<< Updated upstream
  @ManyToOne(() => MemberEntity, (members) => members.chat)
  @JoinTable()
  members: MemberEntity[];
=======
  @ManyToOne(() => MemberEntity)
  members: MemberEntity[];

  @OneToMany(() => MsgEntity, (message) => message.chat)
  messages: MsgEntity[]
>>>>>>> Stashed changes
>>>>>>> Stashed changes

  }