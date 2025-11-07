import { EmbedBuilder } from 'discord.js';
import { BotClient, ChatInputCommandInteraction, Command, Message } from '../../../structures/index';
import { MusicCheck } from '../../../helpers/decorators/Music';


export default class LofiCommand extends Command {
    constructor(client: BotClient) {
        super(client, {
            name: 'lofi',
            description: {
                content: 'Apply Lofi filter to the player.',
                usage: 'lofi',
                examples: ['lofi'],
            },
            aliases: ["lf"],
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
        if (!player.filters.includes('lofi')) {
            player.filters.push('lofi');
            player.player.setLowPass({ smoothing: 20 });
            ctx instanceof Message ? ctx.safeReply({ embeds: [embed.setDescription('\`✅\` Applied Lofi filter.')] }) : ctx.reply({ embeds: [embed.setDescription('\`✅\` Applied Lofi filter.')] });
        } else {
            player.filters = player.filters.filter(f => f !== 'lofi');
            player.player.clearFilters();
            ctx instanceof Message ? ctx.safeReply({ embeds: [embed.setDescription('\`✅\` Removed Lofi filter.')] }) : ctx.reply({ embeds: [embed.setDescription('\`✅\` Removed Lofi filter.')] });
        }
        return;
    }
}