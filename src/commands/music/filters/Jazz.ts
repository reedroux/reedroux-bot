import { EmbedBuilder } from 'discord.js';
import { BotClient, ChatInputCommandInteraction, Command, Message } from '../../../structures/index';
import { MusicCheck } from '../../../helpers/decorators/Music';


export default class JazzCommand extends Command {
    constructor(client: BotClient) {
        super(client, {
            name: 'jazz',
            description: {
                content: 'Apply the Jazz filter to the player.',
                usage: 'jazz',
                examples: ['jazz'],
            },
            aliases: ["jazzify", "jazz"],
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
        if (!player.filters.includes('jazz')) {
            player.filters.push('jazz');
            const bands = [
                { band: 0, gain: -0.25 },
                { band: 1, gain: 0.48 },
                { band: 2, gain: 0.59 },
                { band: 3, gain: 0.72 },
                { band: 4, gain: 0.56 },
                { band: 5, gain: 0.15 },
                { band: 6, gain: -0.24 },
                { band: 7, gain: -0.24 },
                { band: 8, gain: -0.16 },
                { band: 9, gain: -0.16 },
                { band: 10, gain: 0 },
                { band: 11, gain: 0 },
                { band: 12, gain: 0 },
                { band: 13, gain: 0 },
                { band: 14, gain: 0 }
            ];
            player.player.setEqualizer(bands);
            return ctx instanceof Message ? ctx.safeReply({
                embeds: [embed.setDescription('`✅` Jazz filter has been enabled.')]
            }) : ctx.reply({
                embeds: [embed.setDescription('`✅` Jazz filter has been enabled.')]
            });
        } else {
            player.filters = player.filters.filter(f => f !== 'jazz');
            player.player.setEqualizer([]);
            return ctx instanceof Message ? ctx.safeReply({
                embeds: [embed.setDescription('`✅` Jazz filter has been disabled.')]
            }) : ctx.reply({
                embeds: [embed.setDescription('`✅` Jazz filter has been disabled.')]
            });
        }
    }
}