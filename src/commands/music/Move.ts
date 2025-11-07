import { EmbedBuilder, GuildMember } from 'discord.js';
import { BotClient, ChatInputCommandInteraction, ApplicationCommandOptionType, Command, Message } from '../../structures/index';
import { MusicCheck } from '../../helpers/decorators/Music';


export default class Move extends Command {
    constructor(client: BotClient) {
        super(client, {
            name: 'move',
            description: {
                content: 'Move the bot to a different voice channel or move tracks to a different position',
                usage: 'move <bot|track> <from> <to>',
                examples: ['move bot', 'move track 1 3'],
            },
            aliases: ['mv'],
            category: 'music',
            cooldown: 5,
            args: true,
            permissions: {
                dev: false,
                client: ['SendMessages', 'ViewChannel', 'EmbedLinks'],
                user: ['Connect', 'Speak'],
            },
            slashCommand: true,
            options: [
                {
                    name: "bot",
                    description: "The bot will move to your voice channel if you are in one.",
                    type: ApplicationCommandOptionType.Subcommand,
                },
                {
                    name: 'track',
                    description: 'The track number to move',
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: 'from',
                            description: 'The track number to move',
                            type: ApplicationCommandOptionType.Integer,
                            required: true,
                        },
                        {
                            name: 'to',
                            description: 'The new position of the track',
                            type: ApplicationCommandOptionType.Integer,
                            required: true,
                        }
                    ]
                }
            ],
        });
    }

    public async messageRun(message: Message, args: string[]): Promise<any> {
        const subCommand = args[0];
        if (subCommand === 'bot') {
            return this.moveBot(message);
        } else if (subCommand === 'track') {
            return this.moveTrack(message, parseInt(args[1]), parseInt(args[2]));
        }
    }

    public async slashRun(interaction: ChatInputCommandInteraction): Promise<any> {
        const subCommand = interaction.options.getSubcommand();
        if (subCommand === 'bot') {
            return this.moveBot(interaction);
        } else if (subCommand === 'track') {
            return this.moveTrack(interaction, interaction.options.getInteger('from', true), interaction.options.getInteger('to', true));
        }
    }

    @MusicCheck({
        inVoice: true,
        sameVoice: false,
        player: {
            isPlayer: true,
        },
    })
    private async moveBot(ctx: ChatInputCommandInteraction | Message): Promise<any> {
        const embed = new EmbedBuilder().setColor(this.client.config.colors.main);
        const connection = this.client.shoukaku.connections.get(ctx.guild.id);

        if (!connection) {
            return ctx instanceof Message ? ctx.safeReply({ embeds: [embed.setDescription('\`❌\` The bot is not in a voice channel.')] }) : ctx.reply({ embeds: [embed.setDescription('\`❌\` The bot is not in a voice channel.')] });
        }
        if (ctx.member instanceof GuildMember) {
            connection.setVoiceChannel(ctx.member.voice.channelId);
            ctx instanceof Message ? ctx.safeReply({ embeds: [embed.setDescription(`\`✅\` Moved the bot to your voice ${ctx.member.voice ? ctx.member.voice.channel : 'channel'}.`)] }) : ctx.reply({ embeds: [embed.setDescription(`\`✅\` Moved the bot to your voice ${ctx.member.voice ? ctx.member.voice.channel : 'channel'}.`)] });
        }
    }

    @MusicCheck({
        inVoice: true,
        sameVoice: true,
        player: {
            requireQueue: true,
        },
    })
    private async moveTrack(ctx: ChatInputCommandInteraction | Message, from: number, to: number): Promise<any> {
        const embed = new EmbedBuilder().setColor(this.client.config.colors.main);
        const player = this.client.queue.getPlayer(ctx.guild.id);

        if (isNaN(from) || isNaN(to)) {
            return ctx instanceof Message ? ctx.safeReply({ embeds: [embed.setDescription('\`❌\` Please provide a valid number.')] }) : ctx.reply({ embeds: [embed.setDescription('\`❌\` Please provide a valid number.')] });
        }

        if (from < 1 || from > player.queue.length || to < 1 || to > player.queue.length) {
            return ctx instanceof Message ? ctx.safeReply({ embeds: [embed.setDescription(`\`❌\` Please provide a valid number between 1 and ${player.queue.length}.`)] }) : ctx.reply({ embeds: [embed.setDescription(`\`❌\` Please provide a valid number between 1 and ${player.queue.length}.`)] });
        }

        const track = player.queue[from - 1];
        player.queue.splice(from - 1, 1);
        player.queue.splice(to - 1, 0, track);
        return ctx instanceof Message ? ctx.safeReply({ embeds: [embed.setDescription(`\`✅\` Moved track ${from} to ${to}.`)] }) : ctx.reply({ embeds: [embed.setDescription(`\`✅\` Moved track ${from} to ${to}.`)] });
    }
}