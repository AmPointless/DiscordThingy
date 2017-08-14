/**
 * Created by Pointless on 20/07/17.
 */
import {Client, Message, TextChannel, GuildMember, User, Channel, MessageReaction} from 'discord.js';
import DiscordThingy from './discordthingy';

let wrongLogChannelPermsWarn = false;

export default class Responder {
  private client: Client;

  constructor(private thingy: DiscordThingy) {
    this.client = thingy.client;
  }

  public async fail(message: Message, reason?: string): Promise<Message|MessageReaction> {
    if(
        (
            !this._hasChannelPerm(message.channel, this.client.user, 'SEND_MESSAGES') ||
            !reason
        ) &&
        this._hasChannelPerm(message.channel, this.client.user, 'ADD_REACTIONS')
    ) { // If messages can't be sent, or there isn't a reason, and can react, react
      return message.react('🔥');
    } else if(this._hasChannelPerm(message.channel, this.client.user, 'SEND_MESSAGES')) {
      return message.channel.send({embed: {
        color: 0xF44336,
        description: `:x: *${reason}*`
      }}) as Promise<Message>;
    }
  }

  public async succeed(message: Message, reason?: string): Promise<Message|MessageReaction> {
    if(
        (
            !this._hasChannelPerm(message.channel, this.client.user, 'SEND_MESSAGES') ||
            !reason
        ) &&
        this._hasChannelPerm(message.channel, this.client.user, 'ADD_REACTIONS')
    ) { // If messages can't be sent, or there isn't a reason, and can react, react
      return message.react('✅');
    } else if(this._hasChannelPerm(message.channel, this.client.user, 'SEND_MESSAGES')) {
      return message.channel.send({embed: {
        color: 0x087f23,
        description: `:white_check_mark: *${reason}*`
      }}) as Promise<Message>;
    }
  }

  public rejection(message: Message, info?: string): (error: Error) => Promise<MessageReaction|void> {
    return (error: Error) => {
      return this.internalError(message, error, info);
    };
  }  // Convenience method for handling promise rejections

  public async internalError(error: string|Error, info?: string): Promise<void>;
  public async internalError(message: Message, error: string|Error, info?: string): Promise<MessageReaction|void>

  public async internalError(messageOrError: Message|string|Error, errorOrInfo?: string|Error, info?: string): Promise<MessageReaction|void>{
    if(messageOrError instanceof Message && this._hasChannelPerm(messageOrError.channel, this.client.user, 'ADD_REACTIONS')) {
      this._logError(errorOrInfo, info);
      return messageOrError.react('🔥');
    }else if(messageOrError instanceof Error || typeof errorOrInfo === 'string' ){
      this._logError(messageOrError as Error|string, errorOrInfo as string);
    }
  }

  private _logError(error: string|Error, info?: string): void {
    const errorString = typeof error === 'string' ? error : error.stack || error;
    if(!this.thingy.logChannel || !this._hasChannelPerm(this.thingy.logChannel, this.client.user, 'SEND_MESSAGES')) {
      if(!wrongLogChannelPermsWarn && this.thingy.logChannel){
        console.error(`[${new Date().toTimeString()}] Permissions for log channel (${this.thingy.logChannel.guild.name}#${this.thingy.logChannel.name}) are incorrect.`)
        wrongLogChannelPermsWarn = true;
      }
      return console.error(`[${new Date().toTimeString()}] <ERROR> ${info || ''}\n${errorString}`);
    }

    // Already has perm, because of previous if
    this.thingy.logChannel.send({
      embed: {
        author: {
          icon_url: this.client.user.displayAvatarURL,
          name: this.client.user.tag
        },
        color: 0xF44336,
        description: `\`\`\`${errorString}\`\`\`${info ? `*${info}*` : ''}`,
        footer: {
          icon_url: this.client.user.displayAvatarURL,
          text: 'Internal Error'
        },
        timestamp: new Date()
      }
    })
        .catch(e => {
          console.error(`[${new Date().toTimeString()}] Failed to log error in log channel! Because:`, e, '\n\nOriginal Error: ', error);
        });
  }

  private _hasChannelPerm(channel: Channel|void, member: GuildMember|User, perm: string): boolean {
    return channel &&
        channel.type === 'text' &&
        (channel as TextChannel).permissionsFor(member) &&
        (channel as TextChannel).permissionsFor(member).has(perm as any); // *tableflip*
  }
}
