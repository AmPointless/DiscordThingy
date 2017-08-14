/**
 * Created by Pointless on 14/07/17.
 */
import {Message} from 'discord.js';
import Arguments from './arguments';
import {CommandClass} from './discordthingy';
import {Authorizer} from './authorization';

export const CommandClassSymbol = Symbol('CommandClass');
export const CommandSymbol = Symbol('Command');
export const CommandListSymbol = Symbol('CommandList');

export interface CommandConfig {
  name?: string;
  aliases?: string | string[];
  authorization?: Authorizer;
}

export function CommandClass(target: CommandClass) {
  Reflect.defineMetadata(CommandClassSymbol, true, target);
}

export default function Command(config?: string|CommandConfig) {
  return function(target: Object, propertyKey: string, descriptor: TypedPropertyDescriptor<any>): TypedPropertyDescriptor<any> {
    let originalHandler = descriptor.value;

    Reflect.defineMetadata(CommandClassSymbol, true, target);
    
    // Register the method as a command handler
    let programList = Reflect.getMetadata(CommandListSymbol, target);
    programList
        ? programList.push(propertyKey)
        : programList = [propertyKey];
    Reflect.defineMetadata(CommandListSymbol, programList, target);

    // Add metadata determining how/when to run the command
    if(typeof config === 'string') {
      config = {name: config};
    }else if(!config) {
      config = {name: propertyKey};
    }else if(!config.name){
      config.name = propertyKey;
    }

    if(typeof config.authorization === 'function') {
        descriptor.value = async (message: Message, args: Arguments): Promise<void> => {
          if(await (config as CommandConfig).authorization(message, args)) {
            originalHandler(message, args);
          }
        };
    } else if(config.authorization) {
      throw new Error('Authorization must be a function!');
    }

    if(typeof config.aliases === 'string') {
      config.aliases = [config.aliases];
    }

    Reflect.defineMetadata(CommandSymbol, config, target, propertyKey);

    return descriptor;
  };
}
