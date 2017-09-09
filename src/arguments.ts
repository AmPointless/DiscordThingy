/**
 * Created by Pointless on 16/07/17.
 */
import {Message} from 'discord.js';
import DiscordThingy from './discordthingy';

class Arguments extends Array<string> {
  public isOwner: boolean;

  constructor(
      public message: Message,
      public command: string,
      private args: string[],
      public thingy: DiscordThingy,
  ) {
    super(...(args || []));

    this.isOwner = thingy.owner === message.author.id;
  }

  public contentFrom(position: number): string {
    return this.args.slice(position).join(' ');
  }
}

export default Arguments;
