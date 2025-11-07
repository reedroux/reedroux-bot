import { ActionRowBuilder, ButtonBuilder, Message, TextChannel, VoiceChannel } from 'discord.js';
import { BotClient } from '../../structures';
import { Dispatcher } from '../../structures/music/Dispatcher';
import { playerEmbed } from './Embed';
import { trackButton } from './Buttons';

export async function updateTrack(dispatcher: Dispatcher, client: BotClient, trackButtons = true) {
    if (trackButtons) {
        let message: Message;
        if (dispatcher && dispatcher.textChannel && dispatcher.lastMessage) {
            try {
                let channel: TextChannel;
                channel = client.channels.cache.get(dispatcher.textChannel) as TextChannel;
                if (!channel) {
                    channel = (await client.channels.fetch(dispatcher.textChannel)) as TextChannel;
                }
                message = channel?.messages.cache.get(dispatcher.lastMessage);
                if (!message) {
                    message = await channel?.messages.fetch(dispatcher.lastMessage);
                }
            } catch (error) { }
        }
        if (!message) return;
        if (!dispatcher) return;
        if (message) {
            const embed = playerEmbed(dispatcher.currentTrack);
            const { play, previous, like, skip, stop, volDown, volUp, queue, loop, shuffle } = trackButton(dispatcher);
            const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
                previous,
                stop,
                play,
                skip,
                like
            );
            const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
                volDown,
                loop,
                shuffle,
                queue,
                volUp
            );
            await message
                .edit({
                    embeds: [embed],
                    components: [row, row2],
                })
                .catch(() => null);
        }
    }
}
///channels/${channelID}/voice-status
export async function updateVoiceStatus(dispatcher: Dispatcher, client: BotClient) {
    const voiceChannel = client.channels.cache.get(dispatcher.metadata.voiceChannelId);
    const data = await client.db.getChannelStatus(dispatcher.metadata.guild.id);
    if (data && !data.mode) return;
    if (voiceChannel && voiceChannel.isVoiceBased()) {
        const channel = voiceChannel as VoiceChannel;
        if (!channel.permissionsFor(client.user.id)?.has(281474976710656n)) return;
    }
    if (!voiceChannel) return;
    if (dispatcher && dispatcher.currentTrack && dispatcher.playing) {
        const emoji = {
            play: '▶️',
            pause: '⏸️',
        };
        let title = `${emoji.play} ** ${dispatcher.currentTrack.info.author}** - ${dispatcher.currentTrack.info.title}`;
        if (dispatcher.paused)
            title = `${emoji.pause} ** ${dispatcher.currentTrack.info.author}** - ${dispatcher.currentTrack.info.title}`;
        else if (dispatcher.queue && dispatcher.queue.length > 1)
            title += `- ${dispatcher.queue.length} songs in queue`;
        client.rest
            .put(`/channels/${voiceChannel.id}/voice-status`, {
                auth: true,
                body: {
                    status: title.length > 45 ? title.slice(0, 45) + '...' : title,
                },
            })
            .catch(() => null);
    } else {
        client.rest
            .put(`/channels/${voiceChannel.id}/voice-status`, {
                auth: true,
                body: {
                    status: null,
                },
            })
            .catch(() => null);
    }
}
