import { EmbedBuilder, Guild } from 'discord.js';

import { BotClient, Event } from '../../structures/index';

export default class GuildDelete extends Event {
    constructor(client: BotClient, file: string) {
        super(client, file, {
            name: 'guildDelete',
        });
    }
    public async run(guild: Guild): Promise<any> {
        if (!guild.available) return;

        const owner = await guild.fetchOwner();
        const embed = new EmbedBuilder()
            .setColor(this.client.config.colors.red)
            .setAuthor({ name: guild.name, iconURL: guild.iconURL({ extension: 'jpeg' }) })
            .setDescription(`**${guild.name}** has been removed from my guilds!`)
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
                    name: 'Removed At:',
                    value: `<t:${Math.floor(Date.now() / 1000)}:F>`,
                    inline: true,
                },
                { name: 'ID:', value: guild.id, inline: true }
            )
            .setTimestamp();
        this.client.logger.info(`Left guild: ${guild.name} (${guild.id})`);
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
