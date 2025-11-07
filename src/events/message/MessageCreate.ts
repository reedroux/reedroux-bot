import { ActionRowBuilder, ButtonBuilder, ChannelType, Message } from 'discord.js';

import { BotClient, Event } from '../../structures/index';
import { handleCommands } from '../../handlers/index';

export default class MessageCreate extends Event {
    constructor(client: BotClient, file: string) {
        super(client, file, {
            name: 'messageCreate',
        });
    }
    public async run(message: Message): Promise<any> {
        if (message.author.bot) return;
        if (message.channel.type === ChannelType.DM) return;
        let prefix = await this.client.db.getPrefix(message.guild.id);
        const mention = new RegExp(`^<@!?${this.client.user.id}>( |)$`);

        if (message.content.match(mention)) {
            await message.safeReply({
                content: `Greetings! My prefix is \`${prefix}\` To learn more about my commands, type ${await this.client.printCmd('help')}.`,
            });
            return;
        }
        let isCommand = false;

        message.prefix = prefix;
        const escapeRegex = (str: string): string => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const prefixRegex = new RegExp(
            `^(<@!?${this.client.user.id}>|${escapeRegex(prefix)})\\s*`
        );
        if (!prefixRegex.test(message.content)) return;
        const [matchedPrefix] = message.content.match(prefixRegex)

        if (message.content.startsWith(matchedPrefix)) {
            isCommand = true;
            const args = message.content.slice(matchedPrefix.length).trim().split(/ +/);
            const cmd = this.client.getCommand(args.shift()?.toLowerCase());
            if (cmd) {
                new handleCommands().handlePrefixCommand(message, cmd, args);
            }
        }
        // if not command then run automod
    }
}
