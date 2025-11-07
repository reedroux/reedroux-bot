import { EmbedBuilder } from 'discord.js';
import { BotClient, ChatInputCommandInteraction, Command, Message } from '../../structures/index';
import { MusicCheck } from '../../helpers/decorators/Music';

export default class Stop extends Command {
    constructor(client: BotClient) {
        super(client, {
            name: 'stop',
            description: {
                content: 'Stops the player and clears the queue.',
                usage: 'stop',
                examples: ['stop'],
            },
            aliases: ['off'],
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
        return this.stop(message);
    }
    @MusicCheck({
        isDJ: true,
        player: {
            isPlayer: true,
        }
    })
    public async slashRun(interaction: ChatInputCommandInteraction): Promise<any> {
        return this.stop(interaction);
    }

    private async stop(ctx: ChatInputCommandInteraction | Message): Promise<any> {
        const embed = new EmbedBuilder().setColor(this.client.config.colors.main);
        const player = this.client.queue.getPlayer(ctx.guild.id);

        player.stop();
        return ctx instanceof Message ? ctx.safeReply({ embeds: [embed.setDescription('\`✅\` Stopped the player and cleared the queue.')] }) : ctx.reply({ embeds: [embed.setDescription('\`✅\` Stopped the player and cleared the queue.')] });
    }
}
