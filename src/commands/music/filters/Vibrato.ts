import { EmbedBuilder } from 'discord.js';
import { BotClient, ChatInputCommandInteraction, Command, Message } from '../../../structures/index';
import { MusicCheck } from '../../../helpers/decorators/Music';

// Vibrato filter
export default class VibratoCommand extends Command {
    constructor(client: BotClient) {
        super(client, {
            name: 'vibrato',
            description: {
                content: 'Apply Vibrato filter to the player.',
                usage: 'vibrato',
                examples: ['vibrato'],
            },
            aliases: ["vb"],
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
        if (!player.filters.includes('vibrato')) {
            player.filters.push('vibrato');
            player.player.setVibrato({ frequency: 5, depth: 0.5 });
            ctx instanceof Message ? ctx.safeReply({
                embeds: [embed.setDescription
                    ('\`✅\` Applied Vibrato filter.')]
            }) : ctx.reply({ embeds: [embed.setDescription('\`✅\` Applied Vibrato filter.')] });
        }
        else {
            player.filters = player.filters.filter(f => f !== 'vibrato');
            player.player.setVibrato();
            ctx instanceof Message ? ctx.safeReply({
                embeds: [embed.setDescription(
                    '\`✅\` Removed Vibrato filter.')]
            }) : ctx.reply({
                embeds: [embed.setDescription(
                    '\`✅\` Removed Vibrato filter.')]
            });
        }
        return;
    }
}