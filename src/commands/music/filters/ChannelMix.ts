import { EmbedBuilder } from 'discord.js';
import { BotClient, ChatInputCommandInteraction, Command, Message } from '../../../structures/index';
import { MusicCheck } from '../../../helpers/decorators/Music';

export default class ChannelMixCommand extends Command {
    constructor(client: BotClient) {
        super(client, {
            name: 'channelmix',
            description: {
                content: 'Apply ChannelMix filter to the player.',
                usage: 'channelmix',
                examples: ['channelmix'],
            },
            aliases: ["cmix"],
            category: 'filters',
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
    @MusicCheck({
        isPremium: true,
        player: {
            requireCurrentSong: true,
        }
    })
    public async messageRun(message: Message, args: string[]): Promise<any> {
        return this.applyFilter(message);
    }
    @MusicCheck({
        isPremium: true,
        player: {
            requireCurrentSong: true,
        }
    })
    public async slashRun(interaction: ChatInputCommandInteraction): Promise<any> {
        return this.applyFilter(interaction);
    }

    private async applyFilter(ctx: ChatInputCommandInteraction | Message): Promise<any> {
        const embed = new EmbedBuilder().setColor(this.client.config.colors.main);
        const player = this.client.queue.getPlayer(ctx.guild.id);
        if (player.filters.includes('channelmix')) {
            player.filters = player.filters.filter(f => f !== 'channelmix');
            player.player.setChannelMix({ leftToRight: 0, rightToLeft: 0 });
            ctx instanceof Message ? ctx.safeReply({ embeds: [embed.setDescription('\`✅\` Removed ChannelMix filter.')] }) : ctx.reply({ embeds: [embed.setDescription('\`✅\` Removed ChannelMix filter.')] });
        } else {
            player.filters.push('channelmix');
            player.player.setChannelMix({ leftToRight: 0.5, rightToLeft: 0.5 });
            ctx instanceof Message ? ctx.safeReply({ embeds: [embed.setDescription('\`✅\` Applied ChannelMix filter.')] }) : ctx.reply({ embeds: [embed.setDescription('\`✅\` Applied ChannelMix filter.')] });
        }
        return;
    }
}