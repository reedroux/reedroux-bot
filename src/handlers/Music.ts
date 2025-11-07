import { Dispatcher, Song } from '../structures/music/Dispatcher';
import { BotClient } from '../structures/index';
import { trackButton } from '../helpers/player/Buttons';
import {
    ActionRowBuilder,
    BaseMessageOptions,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    Message,
    TextChannel,
    VoiceChannel,
} from 'discord.js';
import { playerEmbed } from '../helpers/player/Embed';
import { TrackEndEvent } from 'shoukaku';
import { updateVoiceStatus } from '../helpers/player/Update';

export default class handleMusic {
    public async trackStart(client: BotClient, dispatcher: Dispatcher, track: Song): Promise<any> {
        const { play, previous, like, skip, stop, volDown, volUp, queue, loop, shuffle } = trackButton(dispatcher);

        const embed = playerEmbed(track);
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

        const guild = await client.guilds.fetch(dispatcher.metadata.guild.id);
        const butMode = await client.db.getTrackButton(dispatcher.metadata.guild.id);
        const messageOptions: BaseMessageOptions = {
            embeds: [embed],
        };
        messageOptions.components = butMode && butMode.mode ? [row, row2] : [row, row2];

        const annonce = await client.db.getAnnounce(dispatcher.metadata.guild.id);

        if (annonce && annonce.mode) {
            const announceChannel = guild.channels.cache.get(annonce.channelId);
            if (announceChannel && announceChannel instanceof TextChannel) {
                const m = (await announceChannel.safeSend(messageOptions)) as Message;
                if (m) dispatcher.lastMessage = m.id;
            }
        } else {
            const channel = guild.channels.cache.get(dispatcher.textChannel);
            if (channel && channel instanceof TextChannel) {
                const m = (await channel.safeSend(messageOptions)) as Message;
                if (m) dispatcher.lastMessage = m.id;
            }
        }

        const voiceChannel = guild.channels.cache.get(dispatcher.metadata.voiceChannelId) as VoiceChannel;
        if (!voiceChannel) return;

        await updateVoiceStatus(dispatcher, client);
    }

    public async trackEnd(
        client: BotClient,
        dispatcher: Dispatcher,
        track: Song,
        data: TrackEndEvent
    ): Promise<any> {
        dispatcher.previousTracks.push(dispatcher.currentTrack);
        dispatcher.currentTrack = null;

        await dispatcher.deleteLastMessage();

        if (dispatcher.repeat === 'song') dispatcher.queue.unshift(track);
        if (dispatcher.repeat === 'queue') dispatcher.queue.push(track);

        await dispatcher.play();
        const guild = await client.guilds.fetch(dispatcher.metadata.guild.id);
        if (!guild) return;
        const voiceChannel = guild.channels.cache.get(dispatcher.metadata.voiceChannelId) as VoiceChannel;
        if (!voiceChannel) return;

        if (data.reason === "finished") {
            if (dispatcher.autoplay) {
                dispatcher.Autoplay(
                    dispatcher.currentTrack || dispatcher.previousTracks
                        ? dispatcher.previousTracks[dispatcher.previousTracks.length - 1]
                        : null
                );
            }
            await client.db.updateTrackUsage(data.track.encoded);
        }

        await updateVoiceStatus(dispatcher, client);
    }

    public async queueEnd(
        client: BotClient,
        dispatcher: Dispatcher,
        track: Song,
        data: TrackEndEvent
    ): Promise<any> {
        await dispatcher.deleteLastMessage();
        if (dispatcher.repeat === 'song') {
            dispatcher.queue.unshift(track);
        } else if (dispatcher.repeat === 'queue') {
            dispatcher.queue.push(track);
        } else if (dispatcher.repeat === 'off') {
            dispatcher.previousTracks.push(dispatcher.currentTrack);
            dispatcher.currentTrack = null;
        }
        await dispatcher.play();

        await updateVoiceStatus(dispatcher, client);
        const guild = await client.guilds.fetch(dispatcher.metadata.guild.id);
        if (!guild) return;
        const voiceChannel = guild.channels.cache.get(dispatcher.metadata.voiceChannelId) as VoiceChannel;
        if (!voiceChannel) return;

        if (data.reason === "finished") {
            if (dispatcher.autoplay) {
                dispatcher.Autoplay(
                    dispatcher.currentTrack || dispatcher.previousTracks
                        ? dispatcher.previousTracks[dispatcher.previousTracks.length - 1]
                        : null
                );
            }
            await client.db.updateTrackUsage(data.track.encoded);
        }

        await this.endMessage(client, dispatcher, track);
    }

    public async destroy(client: BotClient, dispatcher: Dispatcher): Promise<any> {
        await dispatcher.deleteLastMessage();
        await updateVoiceStatus(dispatcher, client);
    }

    private async endMessage(client: BotClient, dispatcher: Dispatcher, track: Song): Promise<any> {
        if (dispatcher.stopped || dispatcher.playing) return;
        const channel = await client.channels.fetch(dispatcher.textChannel);
        if (!channel || !(channel instanceof TextChannel)) return;
        const queueBut = new ButtonBuilder().setCustomId('queue_end').setLabel('Play Again').setStyle(ButtonStyle.Primary);
        const votebut = new ButtonBuilder().setLabel('Vote').setStyle(ButtonStyle.Link).setURL(client.config.links.vote);
        const buttonRow = new ActionRowBuilder().addComponents(queueBut, votebut);
        if (dispatcher.queueEndMessage) {
            const oldMsg = await channel.messages.fetch(dispatcher.queueEndMessage);
            if (oldMsg) {
                oldMsg.delete().catch(() => { });
            }
        }
        const embed = new EmbedBuilder()
            .setColor(client.config.colors.main)
            .setAuthor({
                name: 'Queue Ended',
                iconURL: client.user.displayAvatarURL()
            })
            .setDescription(`The queue has gracefully ended its musical journey.`)
            .setTimestamp();

        const msg = await channel.safeSend({ embeds: [embed], components: [buttonRow] });
        dispatcher.queueEndMessage = msg?.id;

        const collector = msg?.createMessageComponentCollector({ time: 60000 });
        collector.on('collect', async (interaction) => {
            const guild = await client.guilds.fetch(dispatcher.metadata.guild.id);
            if (!guild) return;
            const voiceChannel = guild.channels.cache.get(dispatcher.metadata.voiceChannelId) as VoiceChannel;
            if (!voiceChannel) return;
            const voiceMembers = voiceChannel?.members.filter((member) => !member.user.bot);
            if (voiceMembers && !voiceMembers.has(interaction.user.id)) {
                interaction.reply({ content: 'You need to be in the voice channel to interact with the button.', ephemeral: true });
            }
            if (interaction.customId === 'queue_end') {
                dispatcher.queue.push(track);
                dispatcher.checkToPlay();
            }
            interaction.update({ components: [new ActionRowBuilder<ButtonBuilder>().addComponents(queueBut.setDisabled(true), votebut)] }).catch(() => { });
        });

        collector.on('end', () => {
            if (msg && !msg.editable) return;
            msg.edit({ components: [new ActionRowBuilder<ButtonBuilder>().addComponents(queueBut.setDisabled(true), votebut)] }).catch(() => { });
        });
    }
}
