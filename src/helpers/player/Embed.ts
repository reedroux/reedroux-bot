import config from '../../config';
import Utils from '../../utils/Utils';
import type { Song } from '../../structures/music/Dispatcher';
import { EmbedBuilder } from 'discord.js';

export function playerEmbed(track: Song) {
    if (!track) return;
    if (!track.info) return;
    const embed = new EmbedBuilder()
        .setColor(config.colors.main)
        .setAuthor({
            name: 'Now Playing',
            iconURL: config.links.disk,
            url: config.links.supportServer,
        })
        .setDescription(`**[${track.info.title}](${track.info.uri})**`)
        .addFields([
            {
                name: 'Duration',
                value: `\`(${Utils.playerTime(track.info.length)})\``,
                inline: true,
            },
            {
                name: 'Requested by',
                value: `<@${track.info.requester.id}>`,
                inline: true,
            },
            {
                name: 'Author',
                value: `[${track.info.author}](https://google.com/search?q=${encodeURIComponent(`${track.info.author}`)})`,
                inline: true,
            },
        ])
        .setThumbnail(track.info.artworkUrl)
        .setImage(
            'https://cdn.discordapp.com/attachments/1113045712259780608/1191645010442076170/4000x4.png'
        );
    return embed;
}
