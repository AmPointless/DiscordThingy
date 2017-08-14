/**
 * Created by Pointless on 13/07/17.
 */
import 'reflect-metadata';
import DiscordThingy from './discordthingy';
import Command, {CommandClass} from './command';
import Authorization from './authorization';
import Arguments from './arguments';
import Responder from './responder';
import defaultMessageParser from './default-message-parser';

const VERSION = require('../package.json').version;

export {
  DiscordThingy,
  Command,
  CommandClass,
  Authorization,
  Arguments,
  Responder,
  defaultMessageParser,
  VERSION
};
