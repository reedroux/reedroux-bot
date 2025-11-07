import { BotClient, ChatInputCommandInteraction, Command, Message } from '../../structures/index';
import { MusicCheck } from '../../helpers/decorators/Music';
import { EmbedBuilder } from 'discord.js';

export default class Leave extends Command {
    constructor(client: BotClient) {
        super(client, {
            name: 'leave',
            description: {
                content: 'Leave the voice channel',
                usage: 'leave',
                examples: ['leave'],
            },
            aliases: ['disconnect', 'dc'],
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
        }
    })
    public async messageRun(message: Message, args: string[]): Promise<any> {
        return this.leave(message);
    }
    @MusicCheck({
        isDJ: true,
        player: {
            isPlayer: true,
        }
    })
    public async slashRun(interaction: ChatInputCommandInteraction): Promise<any> {
        return this.leave(interaction);
    }

    private async leave(ctx: ChatInputCommandInteraction | Message): Promise<any> {
        const embed = new EmbedBuilder().setColor(this.client.config.colors.main);
        const player = this.client.queue.getPlayer(ctx.guild.id);
        await player.destroy();
        return ctx instanceof Message ? ctx.safeReply({ embeds: [embed.setDescription('\`✅\` Player has been destroyed and left the voice channel.')] }) : ctx.reply({ embeds: [embed.setDescription('\`✅\` Player has been destroyed and left the voice channel.')] });
    }
}
