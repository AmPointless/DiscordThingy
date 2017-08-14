/**
 * Created by Pointless on 16/07/17.
 */
import {Message} from 'discord.js';
import DiscordThingy from './discordthingy';

class Arguments extends Array<string> {
  constructor(
      public message: Message,
      public command: string,
      args: string[],
      public thingy: DiscordThingy,
  ) {
    super(...(args || []));

    this.isOwner = thingy.owner === message.author.id;
  }

  public isOwner: boolean;

  public contentFrom(position: number): string {
    return this.slice(position).join(' ');
  }

}

export default Arguments;
