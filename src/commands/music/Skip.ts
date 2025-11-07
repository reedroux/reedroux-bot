import { BotClient, ChatInputCommandInteraction, Command, Message } from '../../structures/index';
import { MusicCheck } from '../../helpers/decorators/Music';
import { EmbedBuilder } from 'discord.js';

export default class Skip extends Command {
    constructor(client: BotClient) {
        super(client, {
            name: 'skip',
            description: {
                content: 'Skip the current song',
                usage: 'skip',
                examples: ['skip'],
            },
            aliases: ['s', 'skips'],
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
        isDJ: true,
        player: {
            isPlayer: true,
            requireQueue: true,
        }
    })
    public async messageRun(message: Message, args: string[]): Promise<any> {
        return this.skip(message);
    }
    @MusicCheck({
        isDJ: true,
        player: {
            isPlayer: true,
            requireQueue: true,
        }
    })
    public async slashRun(interaction: ChatInputCommandInteraction): Promise<any> {
        return this.skip(interaction);
    }

    private async skip(ctx: ChatInputCommandInteraction | Message): Promise<any> {
        const embed = new EmbedBuilder().setColor(this.client.config.colors.main);
        const player = this.client.queue.getPlayer(ctx.guild.id);
        // check if the player is playing
        if (!player.queue.length) return ctx instanceof Message ? ctx.safeReply({ embeds: [embed.setDescription('There is no music playing.')] }) : ctx.reply({ embeds: [embed.setDescription('There is no music playing.')] });
        if (player.player.paused) return ctx instanceof Message ? ctx.safeReply({ embeds: [embed.setDescription('The player is paused.')] }) : ctx.reply({ embeds: [embed.setDescription('The player is paused.')] });
        await player.skip();
        return ctx instanceof Message ? ctx.safeReply({ embeds: [embed.setDescription('\`✅\` Skipped the current track.')] }) : ctx.reply({ embeds: [embed.setDescription('\`✅\` Skipped the current track.')] });
    }
}