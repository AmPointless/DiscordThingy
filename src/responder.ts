/**
 * Created by Pointless on 20/07/17.
 */
import {Client, Message, TextChannel, GuildMember, User, Channel} from 'discord.js';
import DiscordThingy from './discordthingy';

export default class Responder {
  constructor(private thingy: DiscordThingy, private client: Client) {}

  public fail(message: Message, reason?: string): void {
    if(
        (
            !this._hasChannelPerm(message.channel, this.client.user, 'SEND_MESSAGES') ||
            !reason
        ) &&
        this._hasChannelPerm(message.channel, this.client.user, 'ADD_REACTIONS')
    ) {
      message.react('🔥');
    } else {
      message.channel.send({embed: {
        color: 0xF44336,
        description: `:x: *${reason}*`
      }});
    }
  }

  public succeed(message: Message, reason?: string): void {
    if(
        (
            !this._hasChannelPerm(message.channel, this.client.user, 'SEND_MESSAGES') ||
            !reason
        ) &&
        this._hasChannelPerm(message.channel, this.client.user, 'ADD_REACTIONS')
    ) {
      message.react('✅');
    } else {
      message.channel.send({embed: {
        color: 0xF44336,
        description: `:x: *${reason}*`
      }});
    }
  }

  public internalError(message: Message, error: string|Error, info?: string): void {
    if(this._hasChannelPerm(message.channel, this.client.user, 'ADD_REACTIONS')) message.react('🔥');
    this.logError(error, info);
  }

  public rejection(message: Message, info?: string): (error: Error) => void { // Convenience method for handling promise rejections
    return (error: Error) => {
      this.internalError(message, error, info);
    };
  }

  public logError(error: string|Error, info?: string): void {
    const errorString = typeof error === 'string' ? error : error.stack;
    if(!this.thingy.logChannel || !this._hasChannelPerm(this.thingy.logChannel, this.client.user, 'SEND_MESSAGES')) {
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
          console.error(`[${new Date().toTimeString()}]Failed to log error in log channel! Because:`, e, '\n\nOriginal Error: ', error);
        });
  }

  private _hasChannelPerm(channel: Channel, member: GuildMember|User, perm: string): boolean {
    return channel &&
        channel.type === 'text' &&
        (channel as TextChannel).permissionsFor(member) &&
        (channel as TextChannel).permissionsFor(member).has(perm as any); // *tableflip*
  }
}
