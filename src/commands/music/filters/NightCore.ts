import { EmbedBuilder } from 'discord.js';
import { BotClient, ChatInputCommandInteraction, Command, Message } from '../../../structures/index';
import { MusicCheck } from '../../../helpers/decorators/Music';


export default class NightCoreCommand extends Command {
    constructor(client: BotClient) {
        super(client, {
            name: 'nightcore',
            description: {
                content: 'Apply NightCore filter to the player.',
                usage: 'nightcore',
                examples: ['nightcore'],
            },
            aliases: ["nc"],
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
        if (player.filters.includes('nightcore')) {
            player.filters = player.filters.filter(f => f !== 'nightcore');
            player.player.setTimescale();
            ctx instanceof Message ? ctx.safeReply({ embeds: [embed.setDescription('\`✅\` Removed NightCore filter.')] }) : ctx.reply({ embeds: [embed.setDescription('\`✅\` Removed NightCore filter.')] });
        } else {
            player.filters.push('nightcore');
            player.player.setTimescale({ speed: 1.165, pitch: 1.125, rate: 1.2 });
            ctx instanceof Message ? ctx.safeReply({ embeds: [embed.setDescription('\`✅\` Applied NightCore filter.')] }) : ctx.reply({ embeds: [embed.setDescription('\`✅\` Applied NightCore filter.')] });
        }
        return;
    }
}