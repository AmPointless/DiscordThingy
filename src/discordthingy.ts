/**
 * Created by Pointless on 15/07/17.
 */
import {Client, TextChannel, Message, ClientOptions} from 'discord.js';
import Arguments from './arguments';
import CommandLoader, {CommandResolvable} from './command-loader';
import defaultMessageParser from './default-message-parser';
import Responder from './responder';
import {Authorizer} from './authorization';

export interface MessageParser {
  (message: Message): ParsedMessage|void;
}
export interface ParsedMessage { // The object a MessageParser should return
  command: string;
  args: string[];
}

export interface CommandClass {
  new(thingy: DiscordThingy): any;
  [propName: string]: CommandHandler|any;
} // The class a command file should export

export interface CommandObject {
  name: string;
  aliases?: string[];
  authentication?: Symbol;
  category?: string;
  run?: CommandHandler;
  initialize?: (thingy: DiscordThingy) => Promise<void>;
}
export interface CommandHandler {
  (message: Message, args: Arguments): Promise<void>;
} // The object on a command class, gets passed the message and does magic

export interface InternalCommandMetadata {
  key: string;
  name: string;
  triggers: string[];
  authorization?: Authorizer;
  run: CommandHandler
}

export class DiscordThingy {
  public commands: InternalCommandMetadata[] = [];
  public client: Client;
  public logChannel: TextChannel|void;
  public violateToS = false;
  public caseSensitiveCommands = false;
  public owner: string;
  public responder: Responder;

  private _messageParser: MessageParser = defaultMessageParser; // A drop-in function which parses messages
  private _commandLoader: CommandLoader;

  constructor(clientOptions?: ClientOptions) {
    this.client = new Client(clientOptions);
    this._commandLoader = new CommandLoader(this);
    this.responder = new Responder(this);


    this.client.on('message', m => this._handleMessage(m));

    this.client.on('ready', () => console.log(`Ready as ${this.client.user.tag}`));
  }

  // Command adding functions
  public addCommand(command: CommandResolvable): this {
    this._commandLoader.load(command);

    return this;
  }
  public addCommands(commands: CommandResolvable[]): this {
    this._commandLoader.load(commands);

    return this;
  }
  public addCommandDirectory(directory: string): this {
    this._commandLoader.load(directory);

    return this;
  }

  // Config setting functions
  public login(token: string): this {
    this.client.login(token);
    return this;
  }
  public setOwner(ownerId: string): this {
    this.owner = ownerId;
    return this;
  }
  public setLogChannel(channelId: string): this {
    this.client.on('ready', () => {
      let channel = this.client.channels.get(channelId);
      this.logChannel = channel.type !== 'voice' ? (channel as TextChannel) : null;
    });

    return this;
  }
  public setMessageParser(newParser: MessageParser): this {
    this._messageParser = newParser;

    return this;
  }

  private _runMatchingCommands(message: Message, args: Arguments): void {
    let matchingCommands = this.commands.filter(command => {
      return command.triggers.includes(this.caseSensitiveCommands ? args.command : args.command.toLowerCase());
    });
    if(!matchingCommands) return;

    for (let command of matchingCommands){
      let returnValue = command.run(message, args);
      if(returnValue && typeof returnValue.catch === 'function') {
         returnValue.catch((e: Error) => console.error(e.stack));
      }
    }
  }
  private async _handleMessage(message: Message): Promise<void> {
    if(
        !this.violateToS && // If we aren't *planning on* violating the ToS,
        !this.client.user.bot && // and the client isn't a bot
        message.author.id !== this.client.user.id // and the author isn't the client
    ) return; // Ignore the message

    let parsedMessage = this._messageParser(message);
    if(!parsedMessage || !parsedMessage.command) return; // Didn't match, ignore

    let args = new Arguments(message, parsedMessage.command, parsedMessage.args, this);

    this._runMatchingCommands(message, args);
  }
}

export default DiscordThingy;
