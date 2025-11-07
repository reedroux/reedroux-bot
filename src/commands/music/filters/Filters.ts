import { EmbedBuilder } from 'discord.js';
import { BotClient, ChatInputCommandInteraction, Command, Message } from '../../../structures/index';
import { MusicCheck } from '../../../helpers/decorators/Music';


export default class FiltersCommand extends Command {
    constructor(client: BotClient) {
        super(client, {
            name: 'filters',
            description: {
                content: 'Apply filters to the player.',
                usage: 'filters',
                examples: ['filters'],
            },
            aliases: [],
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
        return this.getFilter(message);
    }
    @MusicCheck({
        isPremium: true,
        player: {
            requireCurrentSong: true,
        }
    })
    public async slashRun(interaction: ChatInputCommandInteraction): Promise<any> {
        return this.getFilter(interaction);
    }

    private async getFilter(ctx: ChatInputCommandInteraction | Message): Promise<any> {
        const embed = new EmbedBuilder().setColor(this.client.config.colors.main);
        const player = this.client.queue.getPlayer(ctx.guild.id);
        if (player.filters.length < 1) {
            return ctx instanceof Message ? ctx.safeReply({
                embeds: [embed.setDescription('\`❌\` There are no filters available.')]
            }) : ctx.reply({
                embeds: [embed.setDescription('\`❌\` There are no filters available.')]
            });
        }
        const filtersList = player.filters.map((f) => `\`${f}\``).join(", ");
        return ctx instanceof Message ? ctx.safeReply({
            embeds: [embed.setDescription(`\`✅\` Available filters:\n${filtersList}`)]
        }) : ctx.reply({
            embeds: [embed.setDescription(`\`✅\` Available filters:\n${filtersList}`)]
        });
    }
}
