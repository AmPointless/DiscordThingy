/**
 * Created by Pointless on 15/07/17.
 */
import {Client, TextChannel, Message} from 'discord.js';
import * as path from 'path';
import * as fs from 'fs';
import Arguments from './arguments';
import CommandLoader, {CommandConstructionData} from './command-loader';
import defaultMessageParser from './default-message-parser';

export interface MessageParser {
  (message: Message): ParsedMessage|void;
}
export interface ParsedMessage { // The object a MessageParser should return
  command: string;
  args: string[];
}

export interface CommandClass {
  new(data: CommandConstructionData): CommandClass;
  [propName: string]: CommandHandler|any;
} // The class a command file should export
export interface CommandObject {
  name: string;
  aliases?: string[];
  authentication?: Symbol;
  category?: string;
  run: CommandHandler;
}
export interface CommandHandler {
  (message: Message, args: Arguments): Promise<void>;
} // The object on a command class, gets passed the message and does magic

export interface Authorizer {
  (message: Message, args: Arguments): boolean;
}

export interface InternalCommandMetadata {
  key: string;
  name: string;
  aliases: string[];
  triggers: string[];
  authorization?: Authorizer;
  parent: CommandClass | CommandObject;
}

class DiscordThingy {
  constructor(){
    this.client = new Client();
    this._commandLoader = new CommandLoader(this);

    this.client.on('message', message => {
      if(
          !this.violateToS && // If we aren't *planning on* violating the ToS,
          !this.client.user.bot && // and the client isn't a bot
          message.author.id !== this.client.user.id // and the author isn't the client
      ) return; // Ignore the message

      let parsedMessage = this._messageParser(message);
      if(!parsedMessage) return; // Didn't match, ignore

      let args = new Arguments(message, parsedMessage.command, parsedMessage.args, this.owner === message.author.id);

      this._runMatchingCommands(message, args);
    });

    this.client.on('ready', () => console.log(`Ready as ${this.client.user.tag}`));
  }

  login(token: string): this {
    this.client.login(token);
    return this;
  }

  addCommandDirectory(directory: string): this {
    directory = path.resolve(path.dirname(require.main.filename), directory);

    fs.readdir(directory, (err, files) => {
      files.forEach(file => {
        if(!file.endsWith('.js')) return; // Only load js files, because running sourcemaps is not fun

        this._commandLoader.loadCommandFromFile(`${directory}/${file}`);
      });
    });

    return this;
  }

  addCommand(command: string | CommandClass): this {
    if(typeof command === "string") {
      this._commandLoader.loadCommandFromFile(path.resolve(path.dirname(require.main.filename), command));
    }else if(typeof command === "function") {
      this._commandLoader.loadCommandClass(command);
    }else if(typeof command === "object") {
      this._commandLoader.loadCommandObject(command);
    }else {
      console.error(`Unable to load unrecognised command: ${command}`);
    }

    return this;
  }

  addCommands(commands: string[] | CommandClass[]): this {
    for(let command in commands) {
      this.addCommand(command);
    }

    return this;
  }

  setOwner(ownerId: string): this {
    this.owner = ownerId;
    return this;
  }

  setLogChannel(channelId: string): this {
    this.client.on('ready', () => {
      let channel = this.client.channels.get(channelId);
      this.logChannel = channel.type !== 'voice' ? (channel as TextChannel) : null;
    });

    return this;
  }

  setMessageParser(newParser: MessageParser): this {
    this._messageParser = newParser;

    return this;
  }

  _addCommands(data: InternalCommandMetadata[]): void {
    this.commands.push(...data);
  }

  private _runMatchingCommands(message: Message, args: Arguments): void {
    let matchingCommands = this.commands.filter(command => {
      return command.triggers.includes(this.caseSensitiveCommands ? args.command : args.command.toLowerCase());
    });
    if(!matchingCommands) return;

    for (let command of matchingCommands){
      if(command.authorization && !command.authorization(message, args)) return;
      let returnValue = (command.parent as any)[command.key](message, args);
      returnValue && typeof returnValue.catch === 'function' && returnValue.catch((e: Error) => console.error(e.stack));
    }
  }

  private _messageParser: MessageParser = defaultMessageParser; // A drop-in function which parses messages
  private _commandLoader: CommandLoader;
  private commands: InternalCommandMetadata[] = [];

  client: Client;
  logChannel: TextChannel|void;
  violateToS = false;
  caseSensitiveCommands = false;
  owner = "";
}

export default DiscordThingy;
