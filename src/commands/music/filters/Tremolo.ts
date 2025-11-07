import { EmbedBuilder } from 'discord.js';
import { BotClient, ChatInputCommandInteraction, Command, Message } from '../../../structures/index';
import { MusicCheck } from '../../../helpers/decorators/Music';


export default class TremoloCommand extends Command {
    constructor(client: BotClient) {
        super(client, {
            name: 'tremolo',
            description: {
                content: 'Apply Tremolo filter to the player.',
                usage: 'tremolo',
                examples: ['tremolo'],
            },
            aliases: ["tr"],
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
        if (!player.filters.includes('tremolo')) {
            player.filters.push('tremolo');
            player.player.setTremolo({ frequency: 4, depth: 0.75 }),
                ctx instanceof Message ? ctx.safeReply({ embeds: [embed.setDescription('\`✅\` Applied Tremolo filter.')] }) : ctx.reply({ embeds: [embed.setDescription('\`✅\` Applied Tremolo filter.')] });
        } else {
            player.filters = player.filters.filter(f => f !== 'tremolo');
            player.player.setTremolo();
            ctx instanceof Message ? ctx.safeReply({ embeds: [embed.setDescription('\`✅\` Removed Tremolo filter.')] }) : ctx.reply({ embeds: [embed.setDescription('\`✅\` Removed Tremolo filter.')] });
        }
        return;
    }
}