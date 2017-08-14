/**
 * Created by Pointless on 17/07/17.
 */
import DiscordThingy, {CommandClass, CommandObject, InternalCommandMetadata} from './discordthingy';
import {CommandClassSymbol, CommandConfig, CommandListSymbol, CommandSymbol} from './command';
import {Client, Message} from 'discord.js';
import * as fs from 'fs';
import * as path from 'path';
import Arguments from './arguments';

export type CommandResolvable = CommandClass | CommandObject | string;

export default class CommandLoader {
  constructor(private thingy: DiscordThingy) {}

  public load(arg: CommandResolvable | CommandResolvable[]): void {
    if(!Array.isArray(arg)) arg = [arg];

    arg.forEach(resolvable => {
      if(typeof resolvable === 'string') {
        resolvable = path.resolve(path.dirname(require.main.filename), resolvable);
        let stat = fs.statSync(resolvable);
        if(stat.isDirectory()) {
          this._loadDirectory(resolvable);
        }else if(stat.isFile()) {
          this._loadFile(resolvable);
        }
      }else if(typeof resolvable === 'function') {
        this._loadClass(resolvable);
      }else if(typeof resolvable === 'object') {
        this._loadObject(resolvable);
      }
    });
  }

  private _loadDirectory(dir: string) {
    fs.readdir(dir, (err, files) => {
      // if(err) reject(err);

      files.map(file => {
        if(!file.endsWith('.js')) return; // Only load js files, because running sourcemaps is not fun

        return this._loadFile(`${dir}/${file}`);
      });
    });
  }

  private _loadFile(file: string) {
    let fileExports = require(file);
    if(!fileExports) {
      throw new Error(`${file} does not export anything!`);
    }

    let object: CommandClass|CommandObject;
    if(
        fileExports.__esModule &&
        fileExports.default &&
        (
            typeof fileExports.default === 'function' ||
            (typeof fileExports.default === 'object' && this._isCommandObject(fileExports.default))
        ) // If it's a esModule that exports a default and it's an object or function
    ) {
      object = fileExports.default;
    } else if(
        typeof fileExports === 'function' ||
        (typeof fileExports === 'object' && this._isCommandObject(fileExports))
    ) {
      object = fileExports;
    } else return;

    if(typeof object === 'function') this._loadClass(object); // If it's a function, let's assume it's a class
    else if(typeof object === 'object') this._loadObject(object);
  }

  private _loadClass(commandClass: CommandClass) {
    if(!Reflect.getMetadata(CommandClassSymbol, commandClass)) return;

    let instance = new commandClass(this.thingy);

    let commandKeys = Reflect.getMetadata(CommandListSymbol, instance);
    if(!commandKeys) return;

    let commands: InternalCommandMetadata[] = commandKeys.map((key: string) => {
      let config: CommandConfig = Reflect.getMetadata(CommandSymbol, instance, key);
      let triggers = this._getTriggers(config.name, ...(config.aliases || []));

      return {
        name: config.name,
        run: (m: Message, a: Arguments) => instance[key](m, a),
        authorization: config.authorization,
        triggers
      };
    });

    return this.thingy.commands.push(...commands);
  }

  private _loadObject(commandObject: object) {
    throw new Error('Maybe try using this in a few weeks. It\'s not ready yet.');
    // if(!object.name) {
    //   throw new Error(`Command ${JSON.stringify(object)} doesn\'t have a name!`);
    // }
    // object.aliases = object.aliases || [];
    //
    // if(!object.run) {
    //   if(!object.initialize) return;
    //
    //   let responder = this.createResponder(this.thingy.client);
    //   object.initialize({
    //     client: this.thingy.client,
    //     responder
    //   })
    //       .catch(e => {
    //         responder.logError(e, `Failed to initialise command '${object.name || JSON.stringify(object, null, 1)}'`);
    //       });
    //
    // }else {
    //   this.thingy.commands.push({
    //     aliases: object.aliases,
    //     key: 'run',
    //     name: object.name,
    //     parent: object,
    //     triggers: this.getTriggers(object.name, ...object.aliases)
    //   });
    // }
    //
    // return true;
  }

  private _isCommandObject(object: CommandObject | any): boolean {
    return typeof object === 'object' && (object.run || object.initialise);
  }
  private _getTriggers(...triggers: string[]) {
    return this.thingy.caseSensitiveCommands ? triggers : triggers.map(t => t.toLowerCase());
  }
}
