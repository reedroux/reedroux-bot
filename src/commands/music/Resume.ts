import { BotClient, ChatInputCommandInteraction, Command, Message } from '../../structures/index';
import { MusicCheck } from '../../helpers/decorators/Music';
import { EmbedBuilder } from 'discord.js';


export default class Resume extends Command {
    constructor(client: BotClient) {
        super(client, {
            name: 'resume',
            description: {
                content: 'Resume the player',
                usage: 'resume',
                examples: ['resume'],
            },
            aliases: ['unpause'],
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
        return this.resume(message);
    }
    @MusicCheck({
        isDJ: true,
        player: {
            isPlayer: true,
            requireCurrentSong: true,
        }
    })
    public async slashRun(interaction: ChatInputCommandInteraction): Promise<any> {
        return this.resume(interaction);
    }

    private async resume(ctx: ChatInputCommandInteraction | Message): Promise<any> {
        const embed = new EmbedBuilder().setColor(this.client.config.colors.main);
        const player = this.client.queue.getPlayer(ctx.guild.id);
        if (!player.paused) {
            return ctx instanceof Message ? ctx.safeReply({ embeds: [embed.setDescription('\`❌\` Looks like the music is already playing.')] }) : ctx.reply({ embeds: [embed.setDescription('\`❌\` Looks like the music is already playing.')] });
        } else {
            await player.pause(false);
            return ctx instanceof Message ? ctx.safeReply({ embeds: [embed.setDescription('\`✅\` The music has been resumed for your listening pleasure.')] }) : ctx.reply({ embeds: [embed.setDescription('\`✅\` The music has been resumed for your listening pleasure.')] });
        }
    }
}