import { EmbedBuilder } from 'discord.js';
import { BotClient, ChatInputCommandInteraction, Command, Message } from '../../../structures/index';
import { MusicCheck } from '../../../helpers/decorators/Music';

export default class _8dCommand extends Command {
    constructor(client: BotClient) {
        super(client, {
            name: '8d',
            description: {
                content: 'Apply 8D filter to the player.',
                usage: '8d',
                examples: ['8d'],
            },
            aliases: ["eightd"],
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
        if (player.filters.includes('8D')) {
            player.player.setRotation();
            player.filters = player.filters.filter(f => f !== '8D');
            ctx instanceof Message ? ctx.safeReply({ embeds: [embed.setDescription('\`✅\` Removed 8D filter.')] }) : ctx.reply({ embeds: [embed.setDescription('\`✅\` Removed 8D filter.')] });
        } else {
            player.filters.push('8D');
            player.player.setRotation({ rotationHz: 0.2 });
            ctx instanceof Message ? ctx.safeReply({ embeds: [embed.setDescription('\`✅\` Applied 8D filter.')] }) : ctx.reply({ embeds: [embed.setDescription('\`✅\` Applied 8D filter.')] });
        }
        return;
    }
}