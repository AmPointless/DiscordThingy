/**
 * Created by Pointless on 14/07/17.
 */
import {Message} from 'discord.js';
import Arguments from './arguments';

export const CommandSymbol = Symbol('Command');
export const CommandListSymbol = Symbol('CommandList');

export interface CommandConfig {
  name: string;
  aliases?: string | string[];
  authorization?: (message: Message, args: Arguments) => Promise<boolean>;
}

export default function Command(config: string|CommandConfig) {
  return function(target: Object, propertyKey: string, descriptor: TypedPropertyDescriptor<any>): TypedPropertyDescriptor<any> {
    let originalHandler = descriptor.value;
    // Register the method as a command handler
    let programList = Reflect.getMetadata(CommandListSymbol, target);
    programList
        ? programList.push(propertyKey)
        : programList = [propertyKey];
    Reflect.defineMetadata(CommandListSymbol, programList, target);

    // Add metadata determining how/when to run the command
    if(typeof config === 'string')
      config = {name: config};

    if(typeof config.authorization === 'function') {
        descriptor.value = async (message: Message, args: Arguments): Promise<void> => {
          if(await (config as CommandConfig).authorization(message, args))
            originalHandler(message, args);
        };
    } else if(config.authorization) throw new Error('Authorization checker must be a function!');

    if(typeof config.aliases === 'string')
      config.aliases = [config.aliases];

    Reflect.defineMetadata(CommandSymbol, config, target, propertyKey);

    return descriptor;
  };
}
