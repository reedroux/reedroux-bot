import { EmbedBuilder } from 'discord.js';
import { BotClient, ChatInputCommandInteraction, Command, Message } from '../../../structures/index';
import { MusicCheck } from '../../../helpers/decorators/Music';


export default class SoftCommand extends Command {
    constructor(client: BotClient) {
        super(client, {
            name: 'soft',
            description: {
                content: 'Apply Soft filter to the player.',
                usage: 'soft',
                examples: ['soft'],
            },
            aliases: ["sof"],
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
        if (player.filters.includes('soft')) {
            player.filters = player.filters.filter(f => f !== 'soft');
            player.player.setEqualizer([]);
            ctx instanceof Message ? ctx.safeReply({ embeds: [embed.setDescription('\`✅\` Removed Soft filter.')] }) : ctx.reply({ embeds: [embed.setDescription('\`✅\` Removed Soft filter.')] });
        } else {
            const bands = [
                { band: 0, gain: 0 },
                { band: 1, gain: 0 },
                { band: 2, gain: 0 },
                { band: 3, gain: 0 },
                { band: 4, gain: 0 },
                { band: 5, gain: 0 },
                { band: 6, gain: 0 },
                { band: 7, gain: 0 },
                { band: 8, gain: -0.25 },
                { band: 9, gain: -0.25 },
                { band: 10, gain: -0.25 },
                { band: 11, gain: -0.25 },
                { band: 12, gain: -0.25 },
                { band: 13, gain: -0.25 },
                { band: 14, gain: -0.25 }
            ];
            player.filters.push('soft');
            player.player.setEqualizer(bands);
            ctx instanceof Message ? ctx.safeReply({ embeds: [embed.setDescription('\`✅\` Applied Soft filter.')] }) : ctx.reply({ embeds: [embed.setDescription('\`✅\` Applied Soft filter.')] });
        }
        return;
    }
}