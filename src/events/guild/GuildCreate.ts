import { EmbedBuilder, Guild } from 'discord.js';

import { BotClient, Event } from '../../structures/index';

export default class GuildCreate extends Event {
    constructor(client: BotClient, file: string) {
        super(client, file, {
            name: 'guildCreate',
        });
    }
    public async run(guild: Guild): Promise<any> {
        const owner = await guild.fetchOwner();
        const embed = new EmbedBuilder()
            .setColor(this.client.config.colors.green)
            .setAuthor({ name: guild.name, iconURL: guild.iconURL({ extension: 'jpeg' }) })
            .setDescription(`**${guild.name}** has been added to my guilds!`)
            .setThumbnail(guild.iconURL({ extension: 'jpeg' }))
            .addFields(
                { name: 'Owner:', value: owner.user.tag, inline: true },
                { name: 'Members:', value: guild.memberCount.toString(), inline: true },
                {
                    name: 'Created At:',
                    value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:F>`,
                    inline: true,
                },
                {
                    name: 'Joined At:',
                    value: `<t:${Math.floor(guild.joinedTimestamp / 1000)}:F>`,
                    inline: true,
                },
                { name: 'ID:', value: guild.id, inline: true }
            )
            .setTimestamp();
        this.client.logger.info(`Joined guild: ${guild.name} (${guild.id})`);
        await fetch(this.client.config.hooks.guildAdd, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                embeds: [embed],
            }),
        });
    }
}
