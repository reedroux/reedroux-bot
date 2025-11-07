import { EmbedBuilder } from 'discord.js';
import { BotClient, ChatInputCommandInteraction, Command, Message } from '../../../structures/index';
import { MusicCheck } from '../../../helpers/decorators/Music';


export default class PitchCommand extends Command {
    constructor(client: BotClient) {
        super(client, {
            name: 'pitch',
            description: {
                content: 'Apply Pitch filter to the player.',
                usage: 'pitch',
                examples: ['pitch'],
            },
            aliases: ["pt"],
            category: 'filters',
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
                    name: "amount",
                    description: "Provide a number between 1 and 5",
                    type: 4,
                    required: true
                }
            ]
        });
    }
    @MusicCheck({
        isPremium: true,
        player: {
            requireCurrentSong: true,
        }
    })
    public async messageRun(message: Message, args: string[]): Promise<any> {
        const amount = parseInt(args[0]);
        if (isNaN(amount) || amount < 1 || amount > 5) return message.reply('Please provide a number between 1 and 5.');

        return this.applyFilter(message, amount);
    }
    @MusicCheck({
        isPremium: true,
        player: {
            requireCurrentSong: true,
        }
    })
    public async slashRun(interaction: ChatInputCommandInteraction): Promise<any> {
        const amount = interaction.options.getInteger('amount');
        return this.applyFilter(interaction, amount);
    }

    private async applyFilter(ctx: ChatInputCommandInteraction | Message, amount: number): Promise<any> {
        const embed = new EmbedBuilder().setColor(this.client.config.colors.main);
        const player = this.client.queue.getPlayer(ctx.guild.id);
        if (player.filters.includes('pitch')) {
            player.filters = player.filters.filter(f => f !== 'pitch');
            player.player.setTimescale();
            return ctx instanceof Message ? ctx.safeReply({ embeds: [embed.setDescription(`\`✅\` Removed Pitch filter.`)] }) : ctx.reply({ embeds: [embed.setDescription(`\`✅\` Removed Pitch filter.`)] });
        } 
        player.filters.push('pitch');
        player.player.setTimescale({ pitch: amount, rate: 1, speed: 1 });

        return ctx instanceof Message ? ctx.safeReply({ embeds: [embed.setDescription(`\`✅\` Applied Pitch filter with amount of ${amount}.`)] }) : ctx.reply({ embeds: [embed.setDescription(`\`✅\` Applied Pitch filter with amount of ${amount}.`)] });
    }
}