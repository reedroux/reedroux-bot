import { ApplicationCommandOptionType, EmbedBuilder } from 'discord.js';
import { BotClient, ChatInputCommandInteraction, Command, Message } from '../../../structures/index';
import { MusicCheck } from '../../../helpers/decorators/Music';


export default class SpeedCommand extends Command {
    constructor(client: BotClient) {
        super(client, {
            name: 'speed',
            description: {
                content: 'Apply Speed filter to the player.',
                usage: 'speed <level>',
                examples: ['speed 2x'],
            },
            aliases: ["spd"],
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
                    name: "level",
                    description: "The level of the speed filter.",
                    type: ApplicationCommandOptionType.Integer,
                    required: true,
                    choices: [
                        {
                            name: "1x",
                            value: 1
                        },
                        {
                            name: "2x",
                            value: 2
                        },
                        {
                            name: "3x",
                            value: 3
                        },
                        {
                            name: "4x",
                            value: 4
                        },
                        {
                            name: "5x",
                            value: 5
                        },
                        {
                            name: "off",
                            value: 0
                        }
                    ]
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
        const level = parseInt(args[0]);
        return this.applyFilter(message, level);
    }
    @MusicCheck({
        isPremium: true,
        player: {
            requireCurrentSong: true,
        }
    })
    public async slashRun(interaction: ChatInputCommandInteraction): Promise<any> {
        const level = interaction.options.getInteger('level');
        return this.applyFilter(interaction, level);
    }

    private async applyFilter(ctx: ChatInputCommandInteraction | Message, level: number): Promise<any> {
        const embed = new EmbedBuilder().setColor(this.client.config.colors.main);
        const player = this.client.queue.getPlayer(ctx.guild.id);
        if (level > 0) {
            player.filters.push('speed');
            player.player.setTimescale({ speed: level });
            ctx instanceof Message ? ctx.safeReply({ embeds: [embed.setDescription(`\`✅\` Applied Speed filter at ${level}x.`)] }) : ctx.reply({ embeds: [embed.setDescription(`\`✅\` Applied Speed filter at ${level}x.`)] });
        } else {
            player.filters = player.filters.filter(f => f !== 'speed');
            player.player.clearFilters();
            ctx instanceof Message ? ctx.safeReply({ embeds: [embed.setDescription('\`✅\` Removed Speed filter.')] }) : ctx.reply({ embeds: [embed.setDescription('\`✅\` Removed Speed filter.')] });
        }
        return;
    }
}