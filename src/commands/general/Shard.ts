import { EmbedBuilder } from 'discord.js';
import { BotClient, ChatInputCommandInteraction, ApplicationCommandOptionType, Command, Message } from '../../structures/index';
import { ShardUtils } from '../../utils/shard-utils';
import { MathUtils } from '../../utils/math-utils';
import { paginate } from '../../helpers/Paginate';

export default class ShardCommand extends Command {
    constructor(client: BotClient) {
        super(client, {
            name: 'shard',
            description: {
                content: 'Get the bot\'s shard information',
                usage: 'shard [guildid]',
                examples: ['shard', 'shard 979291341127311360'],
            },
            category: 'general',
            aliases: ['shards', 'shardinfo'],
            cooldown: 5,
            args: false,
            permissions: {
                dev: false,
                client: ['SendMessages', 'ViewChannel', 'EmbedLinks'],
                user: [],
            },
            slashCommand: true,
            options: [
                {
                    name: 'guildid',
                    description: 'The guild id to get shard info from',
                    type: ApplicationCommandOptionType.String,
                    required: false,
                }
            ]
        });
    }

    public async messageRun(message: Message, args: string[]): Promise<any> {
        const guildId = args[0];

        // check if the user provided a valid guild id
        const guild = guildId ? this.client.guilds.cache.get(guildId) : message.guild;
        if (guildId && !guild) {
            return message.safeReply('Invalid guild id provided');
        }
        return this.shard(message, guildId);
    }

    public async slashRun(interaction: ChatInputCommandInteraction): Promise<any> {
        const guildId = interaction.options.getString('guildid');
        const guild = guildId ? this.client.guilds.cache.get(guildId) : interaction.guild;
        if (guildId && !guild) {
            return interaction.reply('Invalid guild id provided');
        }
        return this.shard(interaction, guildId);
    }

    private async shard(ctx: ChatInputCommandInteraction | Message, guildId?: string): Promise<any> {
        if (!guildId) {
            let shardCount = this.client.shard?.count ?? 1;
            let serverCount: number;
            let userCount: number;
            let players = this.client.shoukaku.options.nodeResolver(this.client.shoukaku.nodes).stats.players;
            let totalPlayers = this.client.shoukaku.options.nodeResolver(this.client.shoukaku.nodes).stats.playingPlayers;

            if (shardCount > 0) {
                serverCount = await ShardUtils.serverCount(this.client.shard);
                userCount = await ShardUtils.userCount(this.client.shard);
            } else {
                serverCount = this.client.guilds.cache.size;
                userCount = this.client.users.cache.size;
            }
            const embeds = [];

            const shardInfo = await this.client.shard.broadcastEval(c => ({
                id: c.shard.ids,
                shards: c.shard.count,
                status: c.shard.client.ws.status,
                guilds: c.guilds.cache.size,
                channels: c.channels.cache.size,
                members: c.guilds.cache.map(g => g.memberCount),
                memoryUsage: (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2),
                ramUsage: (process.memoryUsage().rss / 1024 / 1024).toFixed(2),
                ping: Math.round(c.ws.ping),
            }));

            for (let n = 0; n < shardInfo.length / 3; n++) {
                const shardArray = shardInfo.slice(n * 3, n * 3 + 3);
                const embed = new EmbedBuilder()
                    .setColor(this.client.config.colors.main)
                    .setAuthor({ name: `${this.client.user.username} Shard Info`, iconURL: this.client.user.displayAvatarURL() });
                shardArray.forEach(s => {
                    const status = s.status === 0 ? `\`💚\`` : s.status === 1 ? `\💛\`` : s.status === 2 ? `\🧡\`` : `\❤️️\``
                    embed.addFields(
                        {
                            name: `${status} Shard ${(parseInt(s.id as any) + 0).toString()}`,
                            value: `\`\`\`js\nServers: ${s.guilds}\nChannels: ${s.channels}\nUsers: ${MathUtils.sum(s.members)}\nMemory: ${Number(s.memoryUsage)} MB\nPing: ${s.ping} ms\`\`\``,
                            inline: true,
                        },
                    );
                });
                let totalMemory = 0;
                shardArray.forEach(s => totalMemory += parseInt(s.memoryUsage));
                let totalChannels = 0;
                shardArray.forEach(s => totalChannels += parseInt(s.channels as any));
                let avgLatency = 0;
                shardArray.forEach(s => avgLatency += s.ping);
                avgLatency = avgLatency / shardArray.length;
                avgLatency = Math.round(avgLatency);
                embed.setDescription(`This guild is currently on **Shard ${this.client.shard.ids}**.`);
                embed.addFields(
                    {
                        name: 'Total Stats',
                        value: `\`\`\`js\nTotal Servers: ${serverCount}\nTotal Channels: ${totalChannels}\nTotal Users: ${userCount}\nTotal Memory: ${totalMemory.toFixed(2)} MB\nAvg API Latency: ${Math.round(avgLatency)} ms\nTotal Players: ${players}/${totalPlayers}\`\`\``,
                    },
                );
                embeds.push(embed);
            }
            if (embeds.length > 1) {
                return paginate(ctx, embeds);
            } else {
                return ctx instanceof Message ? ctx.safeReply({ embeds: embeds }) : ctx.reply({ embeds: embeds });
            }
        } else {
            const shardInfo = await ShardUtils.shardInfo(this.client.shard, guildId, this.client.shard.count);
            const status = shardInfo.status === 0 ? `\`💚\`` : shardInfo.status === 1 ? `\💛\`` : shardInfo.status === 2 ? `\🧡\`` : `\❤️️\``
            const embed = new EmbedBuilder()
                .setColor(this.client.config.colors.main)
                .setAuthor({ name: `${this.client.user.username} Shard Info`, iconURL: this.client.user.displayAvatarURL() })
                .setThumbnail(guildId ? this.client.guilds.cache.get(guildId)?.iconURL() : this.client.user.displayAvatarURL())
                .setDescription(`This guild is currently on **Shard ${shardInfo.id + 1}**.`)
                .addFields(
                    {
                        name: `${status} Shard ${(parseInt(shardInfo.id) + 1).toString()}`,
                        value: `\`\`\`js\nServers: ${shardInfo.guilds}\nChannels: ${shardInfo.channels}\nUsers: ${MathUtils.sum(shardInfo.members)}\nMemory: ${Number(shardInfo.memoryUsage)} MB\nPing: ${shardInfo.ping} ms\`\`\``,
                        inline: true,
                    },
                );
            return ctx instanceof Message ? ctx.safeReply({ embeds: [embed] }) : ctx.reply({ embeds: [embed] });
        }
    }
}