import { EmbedBuilder } from 'discord.js';
import { MusicCheck } from '../../helpers/decorators/Music';
import { BotClient, ChatInputCommandInteraction, Command, Message } from '../../structures/index';
import config from '../../config';
import Utils from '../../utils/Utils';


export default class NowPlaying extends Command {
    constructor(client: BotClient) {
        super(client, {
            name: 'nowplaying',
            description: {
                content: 'Shows the current playing song',
                usage: 'nowplaying',
                examples: ['nowplaying'],
            },
            aliases: ['np'],
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
        player: {
            isPlayer: true,
            requireCurrentSong: true,
        }
    })
    public async messageRun(message: Message, args: string[]): Promise<any> {
        return this.nowPlaying(message);
    }
    @MusicCheck({
        player: {
            isPlayer: true,
            requireCurrentSong: true,
        }
    })
    public async slashRun(interaction: ChatInputCommandInteraction): Promise<any> {
        return this.nowPlaying(interaction);
    }

    private async nowPlaying(ctx: ChatInputCommandInteraction | Message): Promise<any> {
        const player = this.client.queue.getPlayer(ctx.guild.id);
        const current = player.currentTrack;

        const parsedCurrentDuration = Utils.playerTime(player.position);
        const parsedDuration = Utils.playerTime(current.info.length);

        const embed = new EmbedBuilder()
            .setColor(this.client.config.colors.main)
            .setTitle(`Now Playing`)
            .setDescription(`**[${current.info.title}](${current.info.uri})**`)
            .addFields([
                {
                    name: "Author:",
                    value: `${current.info.author}`,
                    inline: true
                },
                {
                    name: "Requester:",
                    value: `<@${current.info.requester.id}>`,
                    inline: true
                },
                {
                    name: "Duration:",
                    value: `\`${parsedCurrentDuration} / ${current.info.isStream ? "LIVE" : parsedDuration}\``,
                    inline: true
                },
                {
                    name: "Progress:",
                    value: `${progressBar(player.position, current.info.length)}`
                }
            ])
            .setThumbnail(current.info.artworkUrl)

        return ctx instanceof Message ? ctx.safeReply({ embeds: [embed] }) : ctx.reply({ embeds: [embed] });

    }
}
function progressBar(current, total, size = 20) {
    const percent = Math.round((current / total) * 100);
    const filledSize = Math.max(Math.round((size * current) / total), 1); // Ensure at least one filled character
    const emptySize = size - filledSize;
    const filledChar = "▃";
    const emptyChar = "▁";

    const filledBar = filledChar.repeat(filledSize);
    const emptyBar = emptyChar.repeat(emptySize);
    const progressBar = `[${filledBar}](${config.links.supportServer})${emptyBar} \`[ ${percent}% ]\``;

    return progressBar;
}
