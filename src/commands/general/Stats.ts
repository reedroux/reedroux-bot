import { EmbedBuilder } from 'discord.js';
import { BotClient, ChatInputCommandInteraction, Command, Message } from '../../structures/index';
import { usagePercent } from "node-system-stats";
import { ShardUtils } from '../../utils/shard-utils';
import { FormatUtils } from '../../utils/format-utils';


export default class Stats extends Command {
    constructor(client: BotClient) {
        super(client, {
            name: 'stats',
            description: {
                content: 'Get the bot\'s statistics',
                usage: 'stats',
                examples: ['stats'],
            },
            category: 'general',
            aliases: ['statistics', 'botinfo'],
            cooldown: 5,
            args: false,
            permissions: {
                dev: false,
                client: ['SendMessages', 'ViewChannel', 'EmbedLinks'],
                user: [],
            },
            slashCommand: true,
        });
    }

    public async messageRun(message: Message, args: string[]): Promise<any> {
        return this.stats(message);
    }

    public async slashRun(interaction: ChatInputCommandInteraction): Promise<any> {
        return this.stats(interaction);
    }

    private async stats(ctx: ChatInputCommandInteraction | Message): Promise<any> {
        const embed = new EmbedBuilder().setColor(this.client.config.colors.main);
        const {
            days,
            hours,
            mins,
            realTotalSecs,
            memory,
            shardCount,
            serverCount,
            userCount,
            players,
            totalPlayers,
            totalCommands,
            totalSongs
        } = await this.getBotStats(ctx.client);

        embed.setAuthor({ name: this.client.user.username, iconURL: this.client.user.displayAvatarURL() });
        embed.setDescription(`**${this.client.user.username}** is a Discord bot that plays music in voice channels. It's a simple and easy-to-use bot that offers a wide range of commands to enhance your music experience!`);

        embed.addFields(
            { name: "Birthday:", value: `<t:${Math.round(Number(this.client.user.createdTimestamp) / 1000)}>`, inline: false },
            { name: "Joined On:", value: `<t:${Math.round(ctx.guild.members.me.joinedTimestamp / 1000)}>`, inline: false },
            { name: "Developers", value: `[TwoDawg](https://discord.com/users/135132310260416512), [jancrafter](https://discord.com/users/809890062275182623) [appujet](https://discord.com/users/959276033683628122)`},
            { name: 'Servers:', value: `\`[ ${serverCount} ]\``, inline: true },
            { name: 'Users:', value: `\`[ ${userCount} ]\``, inline: true },
            { name: 'Shard:', value: `\`[ ${this.client.shard?.ids}/${this.client.shard?.count} ]\``, inline: true },
            { name: 'Servers Per Shard:', value: `\`[ ${Math.round(serverCount / shardCount).toLocaleString()} ]\``, inline: true },
            { name: 'Players:', value: `\`[ ${players}/${totalPlayers} ]\``, inline: true },
            { name: 'CPU usage:', value: `\`[ ${(await usagePercent({ coreIndex: 0, sampleMs: 2000 })).percent}% ]\``, inline: true },
            { name: 'Total Used Commands:', value: `\`[ ${totalCommands.toLocaleString()} ]\``, inline: true },
            { name: 'Total Played Songs:', value: `\`[ ${totalSongs.toLocaleString()} ]\``, inline: true },
            { name: 'Uptime:', value: `\`${days} days, ${hours} hours, ${mins} minutes, and ${realTotalSecs} seconds\``, inline: false },
            { name: 'Memory Usage:', value: `\`\`\`nim\nRss: ${FormatUtils.fileSize(memory.rss)}\nHeap Total: ${FormatUtils.fileSize(memory.heapTotal)}\nHeap Used: ${FormatUtils.fileSize(memory.heapUsed)}\n\`\`\`` }
        );
        return ctx instanceof Message ? ctx.safeReply({ embeds: [embed] }) : ctx.reply({ embeds: [embed] });
    }
    public async getBotStats(client): Promise<any> {
        const totalSeconds = process.uptime();
        const realTotalSecs = Math.floor(totalSeconds % 60);
        const days = Math.floor((totalSeconds % (31536 * 100)) / 86400);
        const hours = Math.floor((totalSeconds / 3600) % 24);
        const mins = Math.floor((totalSeconds / 60) % 60);
        const memory = process.memoryUsage();
        let shardCount = client.shard?.count ?? 0;
        let serverCount;
        let userCount;
        let players = client.shoukaku.options.nodeResolver(client.shoukaku.nodes).stats.players;
        let totalPlayers = client.shoukaku.options.nodeResolver(client.shoukaku.nodes).stats.playingPlayers;

        if (shardCount > 1) {
            [serverCount, userCount] = await Promise.all([
                ShardUtils.serverCount(client.shard),
                ShardUtils.userCount(client.shard)
            ]);
        } else {
            serverCount = client.guilds.cache.size;
            userCount = client.users.cache.size;
        }

        const [totalCommands, totalSongs] = await Promise.all([
            client.db.getTotalCommandsUsed(),
            client.db.getTotalTracksUsed()
        ]);

        return {
            days,
            hours,
            mins,
            realTotalSecs,
            memory,
            shardCount,
            serverCount,
            userCount,
            players,
            totalPlayers,
            totalCommands,
            totalSongs
        };
    }
}
