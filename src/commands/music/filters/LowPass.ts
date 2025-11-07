import { EmbedBuilder } from 'discord.js';
import { BotClient, ChatInputCommandInteraction, Command, Message } from '../../../structures/index';
import { MusicCheck } from '../../../helpers/decorators/Music';


export default class LowPassCommand extends Command {
    constructor(client: BotClient) {
        super(client, {
            name: 'lowpass',
            description: {
                content: 'Apply LowPass filter to the player.',
                usage: 'lowpass',
                examples: ['lowpass'],
            },
            aliases: ["lp"],
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
        if (!player.filters.includes('lowpass')) {
            player.filters.push('lowpass');
            player.player.setLowPass({ smoothing: 20 });
            ctx instanceof Message ? ctx.safeReply({ embeds: [embed.setDescription('\`✅\` Applied LowPass filter.')] }) : ctx.reply({ embeds: [embed.setDescription('\`✅\` Applied LowPass filter.')] });
        } else {
            player.filters = player.filters.filter(f => f !== 'lowpass');
            player.player.setLowPass({ smoothing: 1 });
            ctx instanceof Message ? ctx.safeReply({ embeds: [embed.setDescription('\`✅\` Removed LowPass filter.')] }) : ctx.reply({ embeds: [embed.setDescription('\`✅\` Removed LowPass filter.')] });
        }
        return;
    }
}