import { ActionRowBuilder, ButtonBuilder, GuildMember, Message } from 'discord.js';
import { BotClient } from '../structures/index';

export default class BotUtils {

    public static async handleCollectorEnd(message: Message): Promise<void> {
    const newComponents = [];
    for (const row of message.components) {
        const actionRowBuilder = ActionRowBuilder.from(row);
        actionRowBuilder.components.forEach((button: ButtonBuilder) => {
            button.setDisabled(true);
        })
        newComponents.push(actionRowBuilder);
    }
    await message.edit({ components: newComponents }).catch(() => { });
}
    public static async getImageFromMessage(
        message: Message,
        args: string[]
    ): Promise<string | undefined> {
        let url: string | undefined;

        // check for attachments
        if (message.attachments.size > 0) {
            const attachment = message.attachments.first();
            const attachUrl = attachment!.url;
            const attachIsImage =
                attachUrl.endsWith('.png') ||
                attachUrl.endsWith('.jpg') ||
                attachUrl.endsWith('.jpeg');
            if (attachIsImage) url = attachUrl;
        }

        if (!url && args.length === 0)
            url = message.author.displayAvatarURL({ size: 256, extension: 'png' });

        if (!url && args.length !== 0) {
            try {
                url = new URL(args[0]).href;
            } catch (ex) {
                /* Ignore */
            }
        }

        if (!url && message.mentions.users.size > 0) {
            url = message.mentions.users.first()!.displayAvatarURL({ size: 256, extension: 'png' });
        }

        if (!url) {
            const member = await message.guild!.members.fetch(args[0]);
            if (member) url = member.user.displayAvatarURL({ size: 256, extension: 'png' });
        }

        if (!url) url = message.author.displayAvatarURL({ size: 256, extension: 'png' });

        return url;
    }

    public static get musicValidations(): Array<{ callback: (args: any) => any; message: string }> {
        return [
            {
                callback: ({ member }: { member: GuildMember }) => member.voice?.channelId,
                message: `- You have to be connected to a voice channel on this server to use this command!\n\nHow to join a voice channel? Just click on a channel with a speaker icon [See the official Discord guide](https://support.discord.com/hc/en-us/articles/360045138571-Beginner-s-Guide-to-Discord#h_9de92bc2-3bca-459f-8efd-e1e2739ca4f4)`,
            },
            {
                callback: ({ client, guildId }: { client: BotClient; guildId: string }) =>
                    client.queue.getPlayer(guildId),
                message: '- Please join a voice channel and play a song first.',
            },
            {
                callback: ({
                    member,
                    client,
                    guildId,
                }: {
                    member: GuildMember;
                    client: BotClient;
                    guildId: string;
                }) =>
                    member.voice?.channelId ===
                    client.queue.getPlayer(guildId)?.player.node.manager.connections.get(guildId)
                        ?.channelId,
                message: `- You have to be in the same voice channel as the bot to use this command.`,
            },
        ];
    }
}
