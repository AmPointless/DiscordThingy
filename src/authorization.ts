/**
 * Created by Pointless on 15/07/17.
 */
import {Message} from 'discord.js';
import Arguments from './arguments';

export const AuthTypes: string[] = ['OWNER', 'SELF', 'BOT', 'USER'];

function AuthorizationFactory(authType: string) {
  return function(message: Message, args: Arguments, descriptor: void) {
    if (descriptor) {
      throw new Error('Authorization is not a decorator!');
    }

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
  [propName: string]: any
} = {};

AuthTypes.forEach(type => {
  Authorization[type] = AuthorizationFactory(type);
});

export default Authorization;
