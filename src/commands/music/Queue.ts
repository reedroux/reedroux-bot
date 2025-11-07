import Utils from '../../utils/Utils';
import { BotClient, ApplicationCommandOptionType, ChatInputCommandInteraction, Command, Message } from '../../structures/index';
import { EmbedBuilder } from "discord.js";
import { paginate } from '../../helpers/Paginate';
import { MusicCheck } from '../../helpers/decorators/Music';

export default class Queue extends Command {
    constructor(client: BotClient) {
        super(client, {
            name: 'queue',
            description: {
                content: 'Shows the current queue of this server.',
                usage: 'queue',
                examples: ['queue'],
            },
            aliases: ['q'],
            category: 'music',
            cooldown: 5,
            args: false,
            permissions: {
                dev: false,
                client: ['SendMessages', 'ViewChannel', 'EmbedLinks'],
                user: [],
            },
            slashCommand: true,
            options: [
                {
                    name: "page",
                    description: "The page of the queue.",
                    type: ApplicationCommandOptionType.Integer,
                    required: false
                }
            ]
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
        const page = parseInt(args[0]);
        return this.handle(message, page);
    }
    @MusicCheck({
        isDJ: true,
        player: {
            isPlayer: true,
            requireQueue: true,
        }
    })
    public async slashRun(interaction: ChatInputCommandInteraction): Promise<any> {
        const page = interaction.options.getInteger('page');
        return this.handle(interaction, page);
    }
    private async handle(ctx: ChatInputCommandInteraction | Message, page?: number): Promise<any> {
        if (!page) {
            const player = this.client.queue.getPlayer(ctx.guild.id);

            const { title, uri, length, requester } = player.currentTrack.info;
            let pagesNum = Math.ceil(player.queue.length / 10);
            if (pagesNum === 0) pagesNum = 1;
            const songStrings = [];
            for (let i = 0; i < player.queue.length; i++) {
                const song = player.queue[i];
                songStrings.push(`\` ${i + 1} \` **[${song.info.title}](${song.info.uri})** - \`[${Utils.playerTime(song.info.length)}]\` - (<@${song.info.requester.id}>)`);
            }

            let chunks = Utils.chunk(songStrings, 10);
            if (chunks.length === 0) chunks = [songStrings];
            const embeds = chunks.map((chunk, i) => {
                return new EmbedBuilder()
                    .setTitle('Queue')
                    .setColor(this.client.config.colors.main)
                    .setDescription(`- **[${title}](${uri})** - \`[${Utils.playerTime(length)}]\` - (<@${requester.id}>)\n\n${chunk ? chunk.join('\n') : ''}`)
                    .setFooter({ text: `Page ${i + 1} of ${pagesNum}` })
            });
            return paginate(ctx, embeds);
        } else {
            const embed = new EmbedBuilder().setColor(this.client.config.colors.main);
            const player = this.client.queue.getPlayer(ctx.guild.id);
            const { title, uri, length, requester } = player.currentTrack.info;
            let pagesNum = Math.ceil(player.queue.length / 10);
            if (pagesNum === 0) pagesNum = 1;
            const songStrings = [];
            for (let i = 0; i < player.queue.length; i++) {
                const song = player.queue[i];
                songStrings.push(`\` ${i + 1} \` **[${song.info.title}](${song.info.uri})** - \`[${Utils.playerTime(song.info.length)}]\` - (<@${song.info.requester.id}>)`);
            }

            let chunks = Utils.chunk(songStrings, 10);
            if (chunks.length === 0) chunks = [songStrings];
            const embeds = chunks.map((chunk, i) => {
                return new EmbedBuilder()
                    .setTitle('Queue')
                    .setColor(this.client.config.colors.main)
                    .setDescription(`- **[${title}](${uri})** - \`[${Utils.playerTime(length)}]\` - (<@${requester.id}>)\n\n${chunk ? chunk.join('\n') : ''}`)
                    .setFooter({ text: `Page ${i + 1} of ${pagesNum}` })
            });
            if (page > pagesNum || page < 1) return ctx instanceof Message ? ctx.safeReply({ embeds: [embed.setDescription(`\`❌\` Please provide a valid page number between 1 and ${pagesNum}.`)] }) : ctx.reply({ embeds: [embed.setDescription(`\`❌\` Please provide a valid page number between 1 and ${pagesNum}.`)] });
            return ctx instanceof Message ? ctx.safeReply({
                embeds: [
                    embeds[page - 1]
                ]
            }) : ctx.reply({
                embeds: [
                    embeds[page - 1]
                ]
            });
        }
    }
}
