/**
 * Created by Pointless on 15/07/17.
 */
import {Message} from 'discord.js';
import Arguments from './arguments';

export const AuthTypes: string[] = ['OWNER', 'SELF', 'BOT', 'USER'];
export type AuthTypes = 'OWNER' | 'SELF' | 'BOT' | 'USER';

export type Authorizer = (message: Message, args: Arguments) => boolean;

function AuthorizationFactory(authType: string): Authorizer {
  return function(message: Message, args: Arguments): boolean {
    switch(authType.toLowerCase()) {
      case 'self':
        return message.author.id === message.client.user.id;
      case 'bot':
        return message.author.bot;
      case 'user':
        return !message.author.bot;
      case 'owner':
        return args.isOwner;
      default:
        return false;
    }
  };
}


let Authorization: {
  [propName: string]: Authorizer
} = {};

AuthTypes.forEach(type => {
  Authorization[type] = AuthorizationFactory(type);
});

export default Authorization;
