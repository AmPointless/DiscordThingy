/**
 * Created by Pointless on 16/07/17.
 */
import {Message} from 'discord.js';

class Arguments extends Array<string> {
  constructor(
      public message: Message,
      public command: string,
      args: string[],
      public isOwner: boolean,
  ) {
    super(...(args || []));
  }

  public contentFrom(position: number): string {
    return this.slice(position).join(' ');
  }

}

export default Arguments;
