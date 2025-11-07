import { EmbedBuilder } from 'discord.js';
import { BotClient, ChatInputCommandInteraction, Command, Message } from '../../structures/index';
import { MusicCheck } from '../../helpers/decorators/Music';

export default class ClearQueue extends Command {
    constructor(client: BotClient) {
        super(client, {
            name: 'clearqueue',
            description: {
                content: 'Clear the current queue of player.',
                usage: 'clearqueue',
                examples: ['clearqueue'],
            },
            aliases: ['cq'],
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
            requireQueue: true,
        }
    })
    public async messageRun(message: Message, args: string[]): Promise<any> {
        return this.Cleanup(message);
    }
    @MusicCheck({
        isDJ: true,
        player: {
            requireQueue: true,
        }
    })
    public async slashRun(interaction: ChatInputCommandInteraction): Promise<any> {
        return this.Cleanup(interaction);
    }

    private async Cleanup(ctx: ChatInputCommandInteraction | Message): Promise<any> {
        const embed = new EmbedBuilder().setColor(this.client.config.colors.main);
        const player = this.client.queue.getPlayer(ctx.guild.id);
        player.clearQueue();
        ctx instanceof Message ? ctx.safeReply({ embeds: [embed.setDescription('\`✅\` Successfully cleared the queue.')] }) : ctx.reply({ embeds: [embed.setDescription('\`✅\` Successfully cleared the queue.')] });
        return;
    }
}