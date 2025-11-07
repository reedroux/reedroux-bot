import { EmbedBuilder } from 'discord.js';
import { BotClient, ChatInputCommandInteraction, Command, Message } from '../../../structures/index';
import { MusicCheck } from '../../../helpers/decorators/Music';


export default class RockCommand extends Command {
    constructor(client: BotClient) {
        super(client, {
            name: 'rock',
            description: {
                content: 'Apply Rock filter to the player.',
                usage: 'rock',
                examples: ['rock'],
            },
            aliases: ["rk"],
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
        if (player.filters.includes('rock')) {
            player.filters = player.filters.filter(f => f !== 'rock');
            player.player.setEqualizer([]);
            ctx instanceof Message ? ctx.safeReply({ embeds: [embed.setDescription('\`✅\` Removed Rock filter.')] }) : ctx.reply({ embeds: [embed.setDescription('\`✅\` Removed Rock filter.')] });
        } else {
            const bands = [
                { band: 0, gain: 0.300 },
                { band: 1, gain: 0.250 },
                { band: 2, gain: 0.200 },
                { band: 3, gain: 0.100 },
                { band: 4, gain: 0.050 },
                { band: 5, gain: -0.050 },
                { band: 6, gain: -0.150 },
                { band: 7, gain: -0.200 },
                { band: 8, gain: -0.100 },
                { band: 9, gain: -0.050 },
                { band: 10, gain: 0.050 },
                { band: 11, gain: 0.100 },
                { band: 12, gain: 0.200 },
                { band: 13, gain: 0.250 },
                { band: 14, gain: 0.300 }
            ];
            player.filters.push('rock');
            player.player.setEqualizer(bands);
            ctx instanceof Message ? ctx.safeReply({ embeds: [embed.setDescription('\`✅\` Applied Rock filter.')] }) : ctx.reply({ embeds: [embed.setDescription('\`✅\` Applied Rock filter.')] });
        }
        return;
    }
}