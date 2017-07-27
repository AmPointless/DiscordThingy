/**
 * Created by Pointless on 13/07/17.
 */
import 'reflect-metadata';
import DiscordThingy, {CommandClass} from './discordthingy';
import Category from './category';
import Command from './command';
import Authorization from './authorization';
import Arguments from './arguments';
import Responder from './responder';
import {CommandConstructionData} from './command-loader';
import * as DefaultMessageParser from './default-message-parser';

const VERSION = require('../package.json').version;

export {
  DiscordThingy,
  Category,
  Command,
  CommandClass,
  CommandConstructionData,
  Authorization,
  Arguments,
  Responder,
  DefaultMessageParser,
  VERSION
};
