import { BotClient, ChatInputCommandInteraction, ApplicationCommandOptionType, Command, Message } from '../../structures/index';
import { MusicCheck } from '../../helpers/decorators/Music';
import { EmbedBuilder } from 'discord.js';


export default class Skipto extends Command {
    constructor(client: BotClient) {
        super(client, {
            name: 'skipto',
            description: {
                content: 'Skip to a specific song in the queue',
                usage: 'skipto <position>',
                examples: ['skipto 5'],
            },
            aliases: ['st', 'jumpto', 'jump'],
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
                    name: 'position',
                    description: 'The position to skip to',
                    type: ApplicationCommandOptionType.Integer,
                    required: true,
                },
            ],
        });
    }


    public async messageRun(message: Message, args: string[]): Promise<any> {
        return this.skipTo(message, parseInt(args[0]));
    }

    public async slashRun(interaction: ChatInputCommandInteraction): Promise<any> {
        return this.skipTo(interaction, interaction.options.getInteger('position'));
    }
    @MusicCheck({
        inVoice: true,
        sameVoice: true,
        player: {
            requireQueue: true,
        }
    })
    private async skipTo(ctx: ChatInputCommandInteraction | Message, position: number): Promise<any> {
        const embed = new EmbedBuilder().setColor(this.client.config.colors.main);
        if (isNaN(position)) {
            return ctx instanceof Message ? ctx.safeReply({ embeds: [embed.setDescription(`\`❌\` The position must be a number`)] }) : ctx.reply({ embeds: [embed.setDescription(`\`❌\` The position must be a number`)] });
        }
        const player = this.client.queue.getPlayer(ctx.guild.id);
        if (position < 1 || position > player.queue.length) {
            return ctx instanceof Message ? ctx.safeReply({ embeds: [embed.setDescription(`\`❌\` The position must be between 1 and ${player.queue.length}`)] }) : ctx.reply({ embeds: [embed.setDescription(`\`❌\` The position must be between 1 and ${player.queue.length}`)] });
        }

        const song = player.queue[position - 1];
        player.queue.splice(0, position - 1);
        player.skip();
        return ctx instanceof Message ? ctx.safeReply({ embeds: [embed.setDescription(`\`✅\` Skipped to [${song.info.title}](${song.info.uri})`)] }) : ctx.reply({ embeds: [embed.setDescription(`\`✅\` Skipped to [${song.info.title}](${song.info.uri})`)] });
    }
}
