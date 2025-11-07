import { EmbedBuilder } from 'discord.js';
import { MusicCheck } from '../../helpers/decorators/Music';
import { BotClient, ChatInputCommandInteraction, Command, Message } from '../../structures/index';



export default class Volume extends Command {
    constructor(client: BotClient) {
        super(client, {
            name: 'volume',
            description: {
                content: 'Change the volume of the player',
                usage: 'volume <volume>',
                examples: ['volume 50'],
            },
            aliases: ['vol'],
            category: 'music',
            cooldown: 5,
            args: true,
            permissions: {
                dev: false,
                client: ['SendMessages', 'ViewChannel', 'EmbedLinks'],
                user: [],
            },
            slashCommand: true,
            options: [
                {
                    name: 'amount',
                    description: 'The volume you want to set',
                    type: 4,
                    required: true,
                    min_value: 0,
                    max_value: 100,
                },
            ],
        });
    }
    @MusicCheck({
        isDJ: true,
        isVote: true,
        player: {
            isPlayer: true,
            requireCurrentSong: true,
        }
    })
    public async messageRun(message: Message, args: string[]): Promise<any> {
        const volume = parseInt(args[0]);
        if (volume < 0 || volume > 100) return message.safeReply('\`❌\` Volume must be between 0 and 100');
        return this.volume(message, volume);
    }
    @MusicCheck({
        isDJ: true,
        isVote: true,
        player: {
            isPlayer: true,
            requireCurrentSong: true,
        }
    })
    public async slashRun(interaction: ChatInputCommandInteraction): Promise<any> {
        const volume = interaction.options.getInteger('amount', true);
        if (volume < 0 || volume > 100) return interaction.reply('\`❌\` Volume must be between 0 and 100');
        return this.volume(interaction, volume);
    }

    private async volume(ctx: ChatInputCommandInteraction | Message, volume: number): Promise<any> {
        const embed = new EmbedBuilder().setColor(this.client.config.colors.main);
        const player = this.client.queue.getPlayer(ctx.guild.id);
        await player.setVolume(volume);
        return ctx instanceof Message ? ctx.safeReply({ embeds: [embed.setDescription(`\`✅\` Volume successfully set to ${volume}%.`)] }) : ctx.reply({ embeds: [embed.setDescription(`\`✅\` Volume successfully set to ${volume}%.`)] });
    }
}