import { EmbedBuilder } from 'discord.js';
import { BotClient, ChatInputCommandInteraction, Command, Message } from '../../../structures/index';
import { MusicCheck } from '../../../helpers/decorators/Music';


export default class BassBoostCommand extends Command {
    constructor(client: BotClient) {
        super(client, {
            name: 'bassboost',
            description: {
                content: 'Apply BassBoost filter to the player.',
                usage: 'bassboost',
                examples: ['bassboost'],
            },
            aliases: ["bb"],
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
        if (player.filters.includes('bassboost')) {
            player.filters = player.filters.filter(f => f !== 'bassboost');
            player.player.setEqualizer([]);
            ctx instanceof Message ? ctx.safeReply({ embeds: [embed.setDescription('\`✅\` Removed BassBoost filter.')] }) : ctx.reply({ embeds: [embed.setDescription('\`✅\` Removed BassBoost filter.')] });
        } else {
            player.filters.push('bassboost');
            player.player.setEqualizer([{ band: 0, gain: 0.34 }, { band: 1, gain: 0.34 }, { band: 2, gain: 0.34 }, { band: 3, gain: 0.34 }]);
            ctx instanceof Message ? ctx.safeReply({ embeds: [embed.setDescription('\`✅\` Applied BassBoost filter.')] }) : ctx.reply({ embeds: [embed.setDescription('\`✅\` Applied BassBoost filter.')] });
        }
        return;
    }
}