import { EmbedBuilder } from 'discord.js';
import { BotClient, ChatInputCommandInteraction, Command, Message } from '../../structures/index';
import { MusicCheck } from '../../helpers/decorators/Music';

export default class AutoplayCommand extends Command {
    constructor(client: BotClient) {
        super(client, {
            name: 'autoplay',
            description: {
                content: 'Toggle autoplay mode for the player.',
                usage: 'autoplay',
                examples: ['autoplay'],
            },
            aliases: ['ap'],
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
        isVote: true,
        player: {
            requireQueue: true,
        }
    })
    public async messageRun(message: Message, args: string[]): Promise<any> {
        return this.toggleAutoplay(message);
    }
    @MusicCheck({
        isVote: true,
        player: {
            requireQueue: true,
        }
    })
    public async slashRun(interaction: ChatInputCommandInteraction): Promise<any> {
        return this.toggleAutoplay(interaction);
    }

    private async toggleAutoplay(ctx: ChatInputCommandInteraction | Message): Promise<any> {
        const embed = new EmbedBuilder().setColor(this.client.config.colors.main);
        const player = this.client.queue.getPlayer(ctx.guild.id);
        await player.setAutoplay(!player.autoplay);
        ctx instanceof Message ? ctx.safeReply({ embeds: [embed.setDescription(`\`✅\` Autoplay mode is now ${player.autoplay ? '`enabled`' : '`disabled`'}.`)] }) : ctx.reply({ embeds: [embed.setDescription(`\`✅\` Autoplay mode is now ${player.autoplay ? '`enabled`' : '`disabled`'}.`)] });
        return;
    }
}
