/**
 * Created by Pointless on 17/07/17.
 */
import DiscordThingy, {CommandClass, CommandObject, InternalCommandMetadata} from './discordthingy';
import {CommandConfig, CommandListSymbol, CommandSymbol} from './command';
import Responder from './responder';
import {Client} from 'discord.js';

export interface CommandConstructionData {
  responder: Responder;
  client: Client;
}

export default class CommandLoader{
  constructor(private thingy: DiscordThingy) {}

  loadCommandFromFile(filepath: string): true|never {
    let fileExports = require(filepath);
    if(!fileExports)
      throw new Error(`${filepath} does not export anything!`);

    let object: CommandClass|CommandObject;
    if(
        fileExports.__esModule &&
        fileExports.default &&
        (typeof fileExports.default === 'function' ||
            (typeof fileExports.default === 'object' && this.isCommandObject(fileExports.default))
        ) // If it's a esModule that exports a default and it's an object or function
    ) object = fileExports.default;
    else if(
        typeof fileExports === 'function' ||
        (typeof fileExports === 'object' && this.isCommandObject(fileExports) )
    ) object = fileExports;
    else return;

    if(typeof object === 'function') { // If it's a function, let's assume it's a class
      return this.loadCommandClass(object);
    } else if(typeof object === 'object') {
      return this.loadCommandObject(object);
    }
  }

  loadCommandClass(construc: CommandClass): true|never {
    let instance = new construc({
      client: this.thingy.client,
      responder: this.createResponder(this.thingy.client, construc)
    });

    let commandKeys = Reflect.getMetadata(CommandListSymbol, instance);

    let commands: InternalCommandMetadata[] = commandKeys.map((key: string) => {
      let config: CommandConfig = Reflect.getMetadata(CommandSymbol, instance, key);
      let triggers = this.getTriggers(config.name, ...(config.aliases || []));

      return {
        key,
        name: config.name,
        aliases: config.aliases,
        authorization: config.authorization,
        triggers,
        parent: instance
      };
    });
    this.thingy._addCommands(commands);

    return true;
  }

  loadCommandObject(object: CommandObject): true|never {
    if(!object.name) throw new Error(`Command ${JSON.stringify(object)} doesn\'t have a name!`);
    object.aliases = object.aliases || [];
    object.run = object.run || async function(){};
    this.thingy._addCommands([{
      key: 'run',
      name: object.name,
      aliases: object.aliases,
      triggers: this.getTriggers(object.name, ...object.aliases),
      parent: object
    }]);

    return true;
  }

  isCommandObject(object: CommandObject | any): boolean {
    return typeof object === 'object' && (object.run || object.onload);
  }

  getTriggers(...triggers: string[]) {
    return this.thingy.caseSensitiveCommands ? triggers : triggers.map(t => t.toLowerCase());
  }

  createResponder(client: Client, construc: CommandClass): Responder {
    return new Responder(this.thingy, client);
  }
}
