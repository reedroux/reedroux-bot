import { EmbedBuilder } from 'discord.js';
import { BotClient, ChatInputCommandInteraction, Command, Message } from '../../../structures/index';
import { MusicCheck } from '../../../helpers/decorators/Music';


export default class RotationCommand extends Command {
    constructor(client: BotClient) {
        super(client, {
            name: 'rotation',
            description: {
                content: 'Apply Rotation filter to the player.',
                usage: 'rotation',
                examples: ['rotation'],
            },
            aliases: ["rot"],
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
        if (player.filters.includes('rotation')) {
            player.player.setRotation();
            player.filters = player.filters.filter(f => f !== 'rotation');
            ctx instanceof Message ? ctx.safeReply({ embeds: [embed.setDescription('\`✅\` Removed Rotation filter.')] }) : ctx.reply({ embeds: [embed.setDescription('\`✅\` Removed Rotation filter.')] });
        } else {
            player.filters.push('rotation');
            player.player.setRotation({ rotationHz: 0.2 });
            ctx instanceof Message ? ctx.safeReply({ embeds: [embed.setDescription('\`✅\` Applied Rotation filter.')] }) : ctx.reply({ embeds: [embed.setDescription('\`✅\` Applied Rotation filter.')] });
        }
        return;
    }
}