import { BotClient, ChatInputCommandInteraction, Command, Message } from '../../structures/index';
import { MusicCheck } from '../../helpers/decorators/Music';
import { EmbedBuilder } from 'discord.js';


export default class Pause extends Command {
    constructor(client: BotClient) {
        super(client, {
            name: 'pause',
            description: {
                content: 'Pause the current song.',
                usage: 'pause',
                examples: ['pause'],
            },
            aliases: ['resume'],
            category: 'music',
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
        isDJ: true,
        player: {
            isPlayer: true,
            requireCurrentSong: true,
        }
    })
    public async messageRun(message: Message, args: string[]): Promise<any> {
        return this.pause(message);
    }
    @MusicCheck({
        isDJ: true,
        player: {
            isPlayer: true,
            requireCurrentSong: true,
        }
    })
    public async slashRun(interaction: ChatInputCommandInteraction): Promise<any> {
        return this.pause(interaction);
    }
    private async pause(ctx: ChatInputCommandInteraction | Message): Promise<any> {
        const embed = new EmbedBuilder().setColor(this.client.config.colors.main);
        const player = this.client.queue.getPlayer(ctx.guild.id);

        if (player.paused) {
            return ctx instanceof Message ? ctx.safeReply({ embeds: [embed.setDescription('\`❌\` The music is currently paused. No need to pause it again!')] }) : ctx.reply({ embeds: [embed.setDescription('\`❌\` The music is currently paused. No need to pause it again!')] });
        } else {
            await player.pause(true);
            return ctx instanceof Message ? ctx.safeReply({ embeds: [embed.setDescription('\`✅\` The music has been gracefully paused, ready to be resumed.')] }) : ctx.reply({ embeds: [embed.setDescription('\`✅\` The music has been gracefully paused, ready to be resumed.')] });
        }
    }
}