import { EmbedBuilder } from 'discord.js';
import { BotClient, ChatInputCommandInteraction, Command, Message } from '../../../structures/index';
import { MusicCheck } from '../../../helpers/decorators/Music';

export default class VaporwaveCommand extends Command {
    constructor(client: BotClient) {
        super(client, {
            name: 'vaporwave',
            description: {
                content: 'Apply Vaporwave filter to the player.',
                usage: 'vaporwave',
                examples: ['vaporwave'],
            },
            aliases: ["vw"],
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
        if (!player.filters.includes('vaporwave')) {
            player.filters.push('vaporwave');
            player.player.setTimescale({ pitch: 0.5, rate: 0.5, speed: 0.5 }),
                ctx instanceof Message ? ctx.safeReply({ embeds: [embed.setDescription('\`✅\` Applied Vaporwave filter.')] }) : ctx.reply({ embeds: [embed.setDescription('\`✅\` Applied Vaporwave filter.')] });
        } else {
            player.filters = player.filters.filter(f => f !== 'vaporwave');
            player.player.setTimescale()
            ctx instanceof Message ? ctx.safeReply({ embeds: [embed.setDescription('\`✅\` Removed Vaporwave filter.')] }) : ctx.reply({ embeds: [embed.setDescription('\`✅\` Removed Vaporwave filter.')] });
        }
        return;
    }
}
