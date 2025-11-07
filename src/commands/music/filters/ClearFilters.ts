import { BotClient, ChatInputCommandInteraction, Command, Message } from '../../../structures/index';
import { MusicCheck } from '../../../helpers/decorators/Music';
import { EmbedBuilder } from 'discord.js';


export default class ClearFiltersCommand extends Command {
    constructor(client: BotClient) {
        super(client, {
            name: 'clearfilters',
            description: {
                content: 'Clears all filters from the player.',
                usage: 'clearfilters',
                examples: ['clearfilters'],
            },
            aliases: ["cf"],
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
        return this.clearFilters(message);
    }
    @MusicCheck({
        isPremium: true,
        player: {
            requireCurrentSong: true,
        }
    })
    public async slashRun(interaction: ChatInputCommandInteraction): Promise<any> {
        return this.clearFilters(interaction);
    }

    private async clearFilters(ctx: ChatInputCommandInteraction | Message): Promise<any> {
        const embed = new EmbedBuilder().setColor(this.client.config.colors.main);
        const player = this.client.queue.getPlayer(ctx.guild.id);
        player.player.clearFilters();
        return ctx instanceof Message ? ctx.safeReply({ embeds: [embed.setDescription('\`✅\` Cleared all filters.')] }) : ctx.reply({ embeds: [embed.setDescription('\`✅\` Cleared all filters.')] });
    }
}