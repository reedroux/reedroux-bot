import { EmbedBuilder } from 'discord.js';
import { BotClient, ChatInputCommandInteraction, Command, Message } from '../../../structures/index';
import { MusicCheck } from '../../../helpers/decorators/Music';



export default class KaraokeCommand extends Command {
    constructor(client: BotClient) {
        super(client, {
            name: 'karaoke',
            description: {
                content: 'Apply the Karaoke filter to the player.',
                usage: 'karaoke',
                examples: ['karaoke'],
            },
            aliases: ["kara"],
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
        if (!player.filters.includes('karaoke')) {
            player.filters.push('karaoke');
            player.player.setKaraoke({ level: 1, monoLevel: 1, filterBand: 220, filterWidth: 100 });
            return ctx instanceof Message ? ctx.safeReply({
                embeds: [embed.setDescription('`✅` Karaoke filter applied.')]
            }) : ctx.reply({
                embeds: [embed.setDescription('`✅` Karaoke filter applied.')]
            });
        }
        player.filters = player.filters.filter(f => f !== 'karaoke');
        player.player.setKaraoke(null);
        return ctx instanceof Message ? ctx.safeReply({
            embeds: [embed.setDescription('`✅` Karaoke filter removed.')]
        }) : ctx.reply({
            embeds: [embed.setDescription('`✅` Karaoke filter removed.')]
        });
    }
}