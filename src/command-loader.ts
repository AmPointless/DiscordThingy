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

export default class CommandLoader {
  constructor(private thingy: DiscordThingy) {}

  public loadCommandFromFile(filepath: string): true|never {
    let fileExports = require(filepath);
    if(!fileExports) {
      throw new Error(`${filepath} does not export anything!`);
    }

    let object: CommandClass|CommandObject;
    if(
        fileExports.__esModule &&
        fileExports.default &&
        (typeof fileExports.default === 'function' ||
            (typeof fileExports.default === 'object' && this.isCommandObject(fileExports.default))
        ) // If it's a esModule that exports a default and it's an object or function
    ) {
      object = fileExports.default;
    } else if(
        typeof fileExports === 'function' ||
        (typeof fileExports === 'object' && this.isCommandObject(fileExports))
    ) {
      object = fileExports;
    } else return;

    if(typeof object === 'function') this.loadCommandClass(object); // If it's a function, let's assume it's a class
    else if(typeof object === 'object') this.loadCommandObject(object);
  }

  public loadCommandClass(construc: CommandClass): true|never {
    let instance = new construc({
      client: this.thingy.client,
      responder: this.createResponder(this.thingy.client)
    });

    let commandKeys = Reflect.getMetadata(CommandListSymbol, instance);

    let commands: InternalCommandMetadata[] = commandKeys.map((key: string) => {
      let config: CommandConfig = Reflect.getMetadata(CommandSymbol, instance, key);
      let triggers = this.getTriggers(config.name, ...(config.aliases || []));

      return {
        aliases: config.aliases,
        authorization: config.authorization,
        key,
        name: config.name,
        parent: instance,
        triggers
      };
    });
    this.thingy.commands.push(...commands);

    return true;
  }

  public loadCommandObject(object: CommandObject): true|never {
    if(!object.name) {
      throw new Error(`Command ${JSON.stringify(object)} doesn\'t have a name!`);
    }
    object.aliases = object.aliases || [];

    if(!object.run) {
      if(!object.initialize) return;

      let responder = this.createResponder(this.thingy.client);
      object.initialize({
        client: this.thingy.client,
        responder
      })
          .catch(e => {
            responder.logError(e, `Failed to initialise command '${object.name || JSON.stringify(object, null, 1)}'`);
          });

    }else {
      this.thingy.commands.push({
        aliases: object.aliases,
        key: 'run',
        name: object.name,
        parent: object,
        triggers: this.getTriggers(object.name, ...object.aliases)
      });
    }

    return true;
  }

  public isCommandObject(object: CommandObject | any): boolean {
    return typeof object === 'object' && (object.run || object.onload);
  }

  private getTriggers(...triggers: string[]) {
    return this.thingy.caseSensitiveCommands ? triggers : triggers.map(t => t.toLowerCase());
  }

  private createResponder(client: Client): Responder {
    return new Responder(this.thingy, client);
  }
}
