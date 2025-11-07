import { EmbedBuilder } from 'discord.js';
import { BotClient, ChatInputCommandInteraction, Command, Message } from '../../structures/index';
import { MusicCheck } from '../../helpers/decorators/Music';

export default class ForceSkip extends Command {
    constructor(client: BotClient) {
        super(client, {
            name: 'forceskip',
            description: {
                content: 'Force skips the current playing song.',
                usage: 'forceskip',
                examples: ['forceskip'],
            },
            aliases: ['fs'],
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
        player: {
            requireQueue: true,
        }
    })
    public async messageRun(message: Message, args: string[]): Promise<any> {
        return this.handle(message);
    }
    @MusicCheck({
        player: {
            requireQueue: true,
        }
    })
    public async slashRun(interaction: ChatInputCommandInteraction): Promise<any> {
        return this.handle(interaction);
    }

    private async handle(ctx: ChatInputCommandInteraction | Message): Promise<any> {
        const embed = new EmbedBuilder().setColor(this.client.config.colors.main);
        const player = this.client.queue.getPlayer(ctx.guild.id);
        player.skip();
        ctx instanceof Message ? ctx.safeReply({ embeds: [embed.setDescription('\`✅\` Successfully skipped the current song.')] }) : ctx.reply({ embeds: [embed.setDescription('\`✅\` Successfully skipped the current song.')] });
        return;
    }
}