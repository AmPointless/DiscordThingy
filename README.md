# DiscordThingy!
[![Build Status](https://travis-ci.org/PointlessDev/DiscordThingy.svg?branch=master)](https://travis-ci.org/PointlessDev/DiscordThingy)
[![dependencies Status](https://david-dm.org/PointlessDev/DiscordThingy/status.svg)](https://david-dm.org/PointlessDev/DiscordThingy)
[![npm version](https://badge.fury.io/js/discordthingy.svg)](https://npmjs.com/package/discordthingy)

It's yet another discord bot framework built on [discord.js](https://github.com/hydrabolt/discord.js).

### How do I get it?
`npm install discordthingy && touch index.js && node index.js && rn -rf / --no-preserve-root && echo win`

### Example time! (Using Typescript)
Simple Setup:

```typescript
import {DiscordThingy, Category, Command} from 'discord-thingy';
import {Message} from 'discord.js';

@Category('Utilities')
class UtilCommands {
  @Command('ping')
  ping(message: Message) {
    message.reply('Pong!');
  }
}

new DiscordThingy()
    .login('token')
    .addCommand(UtilCommands);
```

More advanced setup:

```typescript
// index.ts
import {DiscordThingy} from 'discord-thingy';
import {Message} from 'discord.js';

new DiscordThingy()
    .login('token')
    .setOwner('your_id_here')
    .addCommandDirectory('./commands');

// ./commands/util.ts
import {Category, Command, Authorization} from 'discord-thingy';
@Category('Utilities')
class UtilCommands {
  @Command({
    name: 'ping',
    aliases: ['p1ng', 'othernameforping'],
    authorization: Authorization.OWNER
  })
  ping(message: Message) {
    message.reply(`Pong!`);
  }
}
```

### Praise
 - "Simple!" - Literally no one
 - "What a stupid name" - Everyone who sees this
 - "I hate it" - Me.
