/**
 * Created by Pointless on 20/07/17.
 */
import {Message} from 'discord.js';
import {ParsedMessage} from './discordthingy';

export default function defaultMessageParser(message: Message): ParsedMessage {
  const INTRO_WORDS = [
    "hey",
    "hi",
    "oi",
    "hello",
    "ey",
    "yo"
  ];

  let content = message.content;
  let matchingIntroWord = INTRO_WORDS.find((word) => {
    return content.toLowerCase().startsWith(word);
  }); // Find an intro word that matches the start of the message, eg, "hey" for command: "hey @bot ..."
  if (!matchingIntroWord) return; // If the command doesn't have a matching intro word, ignore
  let words = message.content.substr(matchingIntroWord.length + 1).split(' '); // Remove the intro word from the start, and split
  let introName;

  // If the user is triggering themselves, allow me
  if (words[0].toLowerCase() === 'me' && message.author.id === this.client.user.id) introName = 'me';
  // See if it mentions the bot
  else if (words[0] === `<@${this.client.user.id}>`) introName = `<@${this.client.user.id}>`;
  // See if it mentions the bot, if the bot has a nickname
  else if (words[0] === `<@!${this.client.user.id}>`) introName = `<@!${this.client.user.id}>`;
  if (!introName) return; // If it starts with an intro word, but doesn't invoke a bot, just ignore

  let strippedContent = message.content.substr(`${matchingIntroWord} ${introName} `.length).trim(); // Remove the invoking words
  if (!strippedContent) return; // If it mentions the bot, but doesnt' ask for anything ignore

  // Ok, we have a valid command, return the things
  let args = strippedContent.split(" ");

  return {
    command: this.caseSensitiveCommands ? args[0] : args[0].toLowerCase(),
    args: args
  };
}