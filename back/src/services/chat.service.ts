import { All, Injectable, NotFoundException } from "@nestjs/common";
import { InjectEntityManager, InjectRepository } from "@nestjs/typeorm";
import { ChatEntity, chat_status } from "../entities/chat.entity";
import { AddMemberDTO, ChatDTO } from "../models/chat.model";
import { createQueryBuilder, EntityManager, MetadataAlreadyExistsError, Not, Repository } from "typeorm";
import { MsgEntity } from "../entities/msg.entity";
import { MemberEntity, quit_status } from "../entities/member.entity";
import { MsgDTO } from "../models/chat.model";
import { UserEntity } from "../entities/user.entity";
import { getgroups } from "process";
import { getHeapCodeStatistics } from "v8";
import { Console, error } from "console";
import { LoginDTO } from "src/models/user.model";

export enum status {
    owner,
    admin,
    default,
    ban
  }

@Injectable()
export class ChatService {
    constructor(
        @InjectRepository(ChatEntity)
        private chatRepository: Repository<ChatEntity>,
        @InjectRepository(MsgEntity)
        private msgRepo: Repository<MsgEntity>,
        @InjectRepository(UserEntity)
        private userRepo: Repository<UserEntity>,
        @InjectRepository(MemberEntity)
        private membersRepo: Repository<MemberEntity>,
        @InjectEntityManager()
        private manager: EntityManager
      ) {}

    async getChat(name: string)
    {
        return await this.chatRepository.findOne(name);
    }

    async getPvmsg(login: string)
    {
        const user = await this.userRepo.findOne({where: {login: login}});
        const channels = await this.membersRepo.find({select: ['id', 'quit_status'], where: {user: user}, relations: ['chat']});

        const tmp: string[] = [];
        channels.forEach((element) => {
            console.log(element.quit_status)
            if (element.quit_status == quit_status.none)
                tmp.push(element.chat.name);
        })
        return tmp;
    }

    async getUser(name: string)
    {
        return await this.userRepo.findOne(name);
    }

    async addOne(data: ChatDTO){
        console.log(data);
        const chat = this.chatRepository.create({...data, messages: [], members: [], mp_message: false});
        return await this.chatRepository.save(chat);
    }

    async defineMp(channel: string)
    {
        const chat = await this.chatRepository.findOne({where:{name: channel}});
        chat.mp_message = true;
        this.chatRepository.save(chat);
    }

    async Mute(data: {channel: string, target: string, sender: string})
    {
        const chat = await this.chatRepository.findOne({where:{name: data.channel}});
        const tomute = await this.getMember(chat, data.target);
        const send = await this.getMember(chat, data.sender);
        if (send.status > status.admin || tomute.status < send.status)
            throw Error("No privilege");
        tomute.mute = true;
        this.membersRepo.save(tomute);
    }

    async unMute(data: {channel: string, target: string, sender: string})
    {
        const chat = await this.chatRepository.findOne({where:{name: data.channel}});
        const tomute = await this.getMember(chat, data.target);
        const send = await this.getMember(chat, data.sender);
        tomute.mute = false;
        this.membersRepo.save(tomute);
    }

    async Quit(data: {channel: string, login: string})
    {
        const chat = await this.chatRepository.findOne({where:{name: data.channel}});
        const membre = await this.getMember(chat, data.login);
        membre.quit_status = quit_status.quit;
        if (membre.status == status.owner)
        {
            try {
                const member = await this.membersRepo.findOne({where: {chat: chat, status: Not(status.owner), quit_status: 0}, relations: ['user']});
                member.status = status.owner;
                this.changeStatus({channel: data.channel, target: member.user.login, sender: data.login, status: 0});
                console.log(member.user);
            }
            catch (e) { console.log(e);}
        }
        return this.membersRepo.save(membre);
    }

    async addMsg(data: MsgDTO){
        const chat = await this.chatRepository.findOne({where:{name: data.channel}, relations: ["messages"]});
        const user = await this.userRepo.findOne({where: {login: data.login}});
        const member = await this.membersRepo.findOne({where: {user: user, chat: chat}, relations: ['chat', 'chat.messages']});
        console.log(member.mute);
        if (member.mute || member.quit_status > quit_status.none)
            throw Error("is mute, quit or ban");
        const message = this.msgRepo.create({"member": member, "message": data.message, "chat": chat});
        chat.messages.push(message);
        await this.chatRepository.save(chat).catch((e) => console.log(e));
        const resu2 = await this.msgRepo.save(message).catch((e) => console.log(e));
        return resu2;
    }

    async memberInChannel(name: string)
    {
        const chat = await this.chatRepository.findOne({select: ["id"], where: {name: name}, relations: ['members', 'members.user']});
        const tmp: {login: string, status: number}[] = [];
        chat.members.forEach((element) => {
            if (element.quit_status == quit_status.none)
                tmp.push({login: element.user.login, status: element.status});
        })
        return tmp;
    }

    async messageInChannel(name: string)
    {
        const chat = await this.chatRepository.findOne({select: ["id"], where: {name: name}, relations: ['messages', 'messages.member', 'messages.member.user']});
        const tmp: {name: string, message: string}[] = [];
        chat.messages.forEach((element) => {
            tmp.push({name: element.member.user.login, message: element.message});
        })
        return tmp;
    }

    async getAccessibleChan()
    {
        const chat = await this.chatRepository.find({
            select: ['name', "status"],
            where: [{status: chat_status.public},
            {status: chat_status.protected}]
        });
        return chat;
    }

    async getMember(chat: ChatEntity, login: string)
    {
        const user = await this.userRepo.findOne({where: {login: login}});
        if (!user)
            throw new NotFoundException();
        const member = await this.membersRepo.findOne({where: {user: user, chat: chat}});
        if (!member)
            throw new NotFoundException();
        return member;
    }

    async changeStatus(data: {channel: string, target: string, sender: string, status: number})
    {
        const chat = await this.chatRepository.findOne({where: {name: data.channel}});
        const target = await this.getMember(chat, data.target);
        const sender = await this.getMember(chat, data.sender);
        if (sender.status >= data.status && (data.status == status.ban && sender.status == status.default))
            throw new Error("you cant up this user");
        target.status = data.status;
        if (sender.status == status.owner && data.status == status.owner)
        {
            sender.status = status.default;
            this.membersRepo.save(sender);
        }
        this.membersRepo.save(target);
    }

    async changeStatusChan(data: {channel: string, login: string, status: number, password: string})
    {
        const chat = await this.getChat(data.channel);
        const member = await this.getMember(chat, data.login);
        if (member.status != status.owner)
            throw Error('not privilige');
        chat.status = data.status;
        if (chat.status == chat_status.protected)
            chat.password = data.password;
        this.chatRepository.save(chat);
    }

    async joinChan(data: {channel: string, login: string, password: string})
    {
        const chat = await this.chatRepository.findOne({where: {name: data.channel}});
        if (!chat)
            throw new NotFoundException();
        if (chat.status == chat_status.protected && data.password != chat.password)
            throw new Error("not good password");
        if (chat.status == chat_status.private)
            throw new Error("cant join private chan");
    }

    async addMember(data: AddMemberDTO)
    {
        const chat = await this.chatRepository.findOne({where: {name: data.channel}});
        if (!chat)
            throw new NotFoundException();
        const user = await this.userRepo.findOne({where: {login: data.login}});
        if (!user)
            throw new NotFoundException();
        const same = await this.membersRepo.findOne({where: {user: user, chat: chat}});
        let member: MemberEntity;
        if (same && same.quit_status > quit_status.none)
        {
            same.quit_status = quit_status.none;
            member = same;
        }
        else
            member = this.membersRepo.create({user: user, status: data.status, mute: false, chat: chat});
        return await this.membersRepo.save(member);
    }
    
    async getMsg(data: number){
        const chat = await this.chatRepository.findOne(data, {relations: ["messages"]});
        return chat.messages;
    }

    async getAll(): Promise<ChatEntity[]>{
        return await this.chatRepository.find();
    }
}
