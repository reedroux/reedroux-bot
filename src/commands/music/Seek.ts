import { BotClient, ChatInputCommandInteraction, Command, Message } from '../../structures/index';
import { MusicCheck } from '../../helpers/decorators/Music';
import { EmbedBuilder } from 'discord.js';
import Utils from '../../utils/Utils';

export default class Seek extends Command {
    constructor(client: BotClient) {
        super(client, {
            name: 'seek',
            description: {
                content: 'Seek the current song',
                usage: 'seek <time>',
                examples: ['seek 30'],
            },
            aliases: ['se'],
            category: 'music',
            cooldown: 5,
            args: true,
            permissions: {
                dev: false,
                client: ['SendMessages', 'ViewChannel', 'EmbedLinks'],
                user: [],
            },
            slashCommand: true,
            options: [
                {
                    name: 'seconds',
                    description: 'The time you want to seek to',
                    type: 10,
                    required: true,
                    min_value: 0,
                },
            ],
        });
    }
    @MusicCheck({
        isDJ: true,
        player: {
            isPlayer: true,
            requireCurrentSong: true,
        }
    })
    public async messageRun(message: Message, args: string[]): Promise<any> {
        return this.seek(message, args[0]);
    }
    @MusicCheck({
        isDJ: true,
        player: {
            isPlayer: true,
            requireCurrentSong: true,
        }
    })
    public async slashRun(interaction: ChatInputCommandInteraction): Promise<any> {
        return this.seek(interaction, interaction.options.getString('seconds', true));
    }

    private async seek(ctx: ChatInputCommandInteraction | Message, seconds: string): Promise<any> {
        const embed = new EmbedBuilder().setColor(this.client.config.colors.main);
        const player = this.client.queue.getPlayer(ctx.guild.id);

        const ms = Utils.parseTime(seconds);
        if (ms === 0) return ctx instanceof Message ? ctx.safeReply({ embeds: [embed.setDescription('\`❌\` Invalid time format.\nExample: 1m 30s, 90s')] }) : ctx.reply({ embeds: [embed.setDescription('\`❌\` Invalid time format.\nExample: 1m 30s, 90s')] });

        if (ms > player.currentTrack.info.length) return ctx instanceof Message ? ctx.safeReply({ embeds: [embed.setDescription('\`❌\` The time you want to seek to is longer than the song.')] }) : ctx.reply({ embeds: [embed.setDescription('\`❌\` The time you want to seek to is longer than the song.')] });

        await player.seek(ms);
        return ctx instanceof Message ? ctx.safeReply({ embeds: [embed.setDescription(`\`✅\` Song successfully seeked to ${Utils.playerTime(ms)}.`)] }) : ctx.reply({ embeds: [embed.setDescription(`\`✅\` Song successfully seeked to ${Utils.playerTime(ms)}.`)] });
    }
}