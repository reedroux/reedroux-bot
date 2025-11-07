import { ActionRowBuilder, APIEmbed, ButtonBuilder, ButtonInteraction, ButtonStyle, Client, GuildMember, User } from 'discord.js';
import { LoopMode } from '../structures/music/Dispatcher';

import { PrismaClient } from '@prisma/client';
import Utils from '../utils/Utils';
const prisma = new PrismaClient();
let page = 0;


export default class handleButtons {
    private client: Client;
    public async handle(interaction: ButtonInteraction): Promise<any> {
        const { customId } = interaction;
        this.client = interaction.client;
        const Button = [
            'PLAY',
            'PREVIOUS',
            'SHUFFLE',
            'SKIP',
            'STOP',
            'VOLDOWN',
            'VOLUP',
            'LOOP',
            'LIKE',
            'VOL_UP',
            'VOL_DOWN',
            'QUEUE',
            'SHUFFLE',
            'PAGINATE_BACK',
            'PAGINATE_FIRST',
            'PAGINATE_LAST',
            'PAGINATE_NEXT',
            'PAGINATE_STOP',
        ];

        if (Button.includes(customId)) {
            if (interaction.member instanceof GuildMember) {
                if (!interaction.member.voice.channel) {
                    return this.buttonReply(
                        interaction,
                        '\`❌\` You need to be in a voice channel to use the buttons',
                        5000
                    );
                } else {
                    if (
                        interaction.guild.members.me.voice.channel &&
                        !interaction.guild.members.me.voice.channel.equals(
                            interaction.member.voice.channel
                        )
                    ) {
                        return this.buttonReply(
                            interaction,
                            '\`❌\` You must be in the same voice channel as the bot to execute this button.',
                            5000
                        );
                    }
                }
            }
            // check if the bot is in a voice channel
            const player = interaction.client.queue.getPlayer(interaction.guildId);
            if (!player)
                return this.buttonReply(
                    interaction,
                    "\`❌\` I'm not connected to a voice channel. Please use the join command to summon me!",
                    5000
                );
            if (!player.currentTrack)
                return this.buttonReply(
                    interaction,
                    '\`❌\` There is no song playing. Please use the play command to add a song to the queue.',
                    5000
                );

            // delete old message if exists
            const excludedButtonIds = [
                'PAGINATE_BACK',
                'PAGINATE_FIRST',
                'PAGINATE_LAST',
                'PAGINATE_NEXT',
                'PAGINATE_STOP',
            ];

            if (!excludedButtonIds.includes(customId)) {
                try {
                    if (player && player.lastMessage) {
                        const msg = await interaction.channel.messages
                            .fetch(player.lastMessage)
                            .catch(() => { });
                        if (msg) {
                            if (interaction.message.id !== msg.id) {
                                return interaction.message.delete().catch(() => { });
                            }
                        }
                    } else {
                        return interaction.message.delete().catch(() => {
                            null;
                        });
                    }
                } catch (e) {
                    return interaction.message.delete().catch(() => { });
                }
            }

            let pagesNum = Math.ceil(player.queue.length / 10);
            if (pagesNum === 0) pagesNum = 1;
            const songStrings = [];

            let chunks;
            let embeds
            const getButton = (page: number): any => {
                const fastEmbed = page === 0;
                const lastEmbed = page === embeds.length - 1;
                const pageEmbed = embeds[page];
                const row = new ActionRowBuilder<ButtonBuilder>()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('PAGINATE_FIRST')
                            .setLabel('First')
                            .setStyle(ButtonStyle.Secondary)
                            .setDisabled(fastEmbed),
                        new ButtonBuilder()
                            .setCustomId('PAGINATE_BACK')
                            .setLabel('Back')
                            .setStyle(ButtonStyle.Secondary)
                            .setDisabled(fastEmbed),
                        new ButtonBuilder()
                            .setCustomId('PAGINATE_STOP')
                            .setLabel('Stop')
                            .setStyle(ButtonStyle.Danger),
                        new ButtonBuilder()
                            .setCustomId('PAGINATE_NEXT')
                            .setLabel('Next')
                            .setStyle(ButtonStyle.Secondary)
                            .setDisabled(lastEmbed),
                        new ButtonBuilder()
                            .setCustomId('PAGINATE_LAST')
                            .setLabel('Last')
                            .setStyle(ButtonStyle.Secondary)
                            .setDisabled(lastEmbed),
                    );
                return { embeds: [pageEmbed], components: [row], ephemeral: true };
            }

            // handle the buttons
            switch (customId) {
                case 'PLAY': {
                    player.pause(!player.paused);
                    return await this.buttonReply(
                        interaction,
                        `\`✅\` ${player.paused ? 'Paused' : 'Resumed'} the beautiful melody.`,
                        5000
                    );
                }
                case 'PREVIOUS': {
                    if (!player.previousTracks) {
                        return this.buttonReply(
                            interaction,
                            '\`❌\` There is no previous song in the playlist.',
                            5000
                        );
                    }
                    player.playPrevious();
                    return await this.buttonReply(
                        interaction,
                        '\`✅\` Resuming the previous enchanting melody.',
                        5000
                    );
                }
                case 'SKIP': {
                    if (!player.queue.length)
                        return this.buttonReply(
                            interaction,
                            '\`❌\` There is no song in the queue. Please use the play command to add a song to the queue.',
                            5000
                        );
                    player.skip();
                    return await this.buttonReply(
                        interaction,
                        '\`✅\` Skipping to the next captivating tune.',
                        5000
                    );
                }
                case 'STOP': {
                    player.stop();
                    return await this.buttonReply(
                        interaction,
                        '\`✅\` Stopped the beautiful melody.',
                        5000
                    );
                }
                case 'VOLDOWN': {
                    if (player.volume - 10 < 0)
                        return this.buttonReply(
                            interaction,
                            '\`❌\` The volume cannot be lower than 0%',
                            5000
                        );
                    player.setVolume(player.volume - 10);
                    return await this.buttonReply(
                        interaction,
                        `\`✅\` Decreased the volume to ${player.volume}%`,
                        5000
                    );
                }
                case 'VOLUP': {
                    if (player.volume + 10 > 100)
                        return this.buttonReply(
                            interaction,
                            '\`❌\` The volume cannot be higher than 100%',
                            5000
                        );
                    player.setVolume(player.volume + 10);
                    return await this.buttonReply(
                        interaction,
                        `\`✅\` Increased the volume to ${player.volume}%`,
                        5000
                    );
                }
                case 'LOOP': {
                    const mode = player.setRepeat();
                    const loopModeMessage =
                        mode === LoopMode.Queue
                            ? '\`✅\` Looping through the queue.'
                            : mode === LoopMode.Song
                                ? '\`✅\` Repeating the current song.'
                                : '\`✅\` Loop mode disabled.';
                    return await this.buttonReply(interaction, loopModeMessage, 5000);
                }
                case 'LIKE': {
                    const track = player.currentTrack;
                    if (track) {
                        const res = await this.toggleLike(interaction.user, track);
                        if (res) {
                            return await this.buttonReply(
                                interaction,
                                `\`✅\` Liked the track [${track.info.title}](${track.info.uri}).`,
                                5000
                            );
                        } else {
                            return await this.buttonReply(
                                interaction,
                                `\`✅\` Removed the like from the track [${track.info.title}](${track.info.uri}).`,
                                5000
                            );
                        }
                    } else {
                        return await this.buttonReply(
                            interaction,
                            '\`❌\` There is no song playing to like.',
                            5000
                        );
                    }
                }
                case 'VOL_UP': {
                    if (player.volume + 10 > 100)
                        return this.buttonReply(
                            interaction,
                            '\`❌\` The volume cannot be higher than 100%',
                            5000
                        );
                    player.setVolume(player.volume + 10);
                    return await this.buttonReply(
                        interaction,
                        `\`✅\` Increased the volume to ${player.volume}%`,
                        5000
                    );
                }
                case 'VOL_DOWN': {
                    if (player.volume - 10 < 0)
                        return this.buttonReply(
                            interaction,
                            '\`❌\` The volume cannot be lower than 0%',
                            5000
                        );
                    player.setVolume(player.volume - 10);
                    return await this.buttonReply(
                        interaction,
                        `\`✅\` Decreased the volume to ${player.volume}%`,
                        5000
                    );
                }
                case 'QUEUE': {
                    if (!player.queue.length)
                        return this.buttonReply(
                            interaction,
                            '\`❌\` There is no song in the queue. Please use the play command to add a song to the queue.',
                            5000
                        );
                    for (let i = 0; i < player.queue.length; i++) {
                        const song = player.queue[i];
                        songStrings.push(`\` ${i + 1} \` **[${song.info.title}](${song.info.uri})** - \`[${Utils.playerTime(song.info.length)}]\` - (<@${song.info.requester.id}>)`);
                    }
                    chunks = Utils.chunk(songStrings, 10);
                    if (chunks.length === 0) chunks = [songStrings];
                    embeds = chunks.map((chunk, i) => {
                        return {
                            title: 'Queue',
                            color: interaction.client.config.colors.orange,
                            description: `**[${player.currentTrack.info.title}](${player.currentTrack.info.uri})** - \`[${Utils.playerTime(player.currentTrack.info.length)}]\`\n\n${chunk ? chunk.join('\n') : ''}`,
                            footer: { text: `Page ${i + 1} of ${pagesNum}` },
                        };
                    });
                    const msgOptions = getButton(0)

                    return await interaction.reply(msgOptions);
                }
                case 'PAGINATE_BACK': {
                    page--;
                    return await interaction.update(getButton(page)).catch(() => { });
                }
                case 'PAGINATE_FIRST': {
                    page = 0;
                    return await interaction.update(getButton(page)).catch(() => { });
                }
                case 'PAGINATE_LAST': {
                    page = embeds.length - 1;
                    return await interaction.update(getButton(page)).catch(() => { });
                }

                case 'PAGINATE_NEXT': {
                    page++;
                    return await interaction.update(getButton(page)).catch(() => { });
                }
                case 'PAGINATE_STOP': {
                    return await interaction.update({ components: [] }).catch(() => { });
                }
                case 'SHUFFLE': {
                    if (player.queue.length < 3) {
                        return this.buttonReply(
                            interaction,
                            '\`❌\` There are less than 3 songs in the playlist, unable to shuffle.',
                            5000
                        );
                    }
                    player.setShuffle();
                    return await this.buttonReply(
                        interaction,
                        `\`✅\` Successfully shuffled the queue.`,
                        5000
                    );
                }
            }
        }
    }

    private async toggleLike(userId: User, track: any) {
        const data = await prisma.playlist.findFirst({
            where: {
                userId: userId.id,
                name: 'Liked Songs',
            },
        });
        if (!data) {
            await prisma.playlist.create({
                data: {
                    playlistId: `${userId.id}-liked-songs`,
                    name: 'Liked Songs',
                    tracks: JSON.stringify([track]),
                    userId: userId.id,
                    visibility: 'private',
                },
            });

            return true;
        } else {
            const tracks = JSON.parse(data.tracks);
            const index = tracks.findIndex((t: any) => t.info.uri === track.info.uri);
            if (index === -1) {
                tracks.push(track);
            } else {
                tracks.splice(index, 1);
            }
            await prisma.playlist.update({
                where: {
                    playlistId: data.playlistId,
                },
                data: {
                    tracks: JSON.stringify(tracks),
                },
            });
            return index === -1;
        }
    }

    private async buttonReply(
        interaction: ButtonInteraction,
        content: string,
        time = 5000
    ): Promise<any> {
        const embed: APIEmbed = {
            author: {
                name: interaction.user.tag,
                icon_url: interaction.user.displayAvatarURL({ extension: 'png', size: 512 }),
            },
            description: content,
            color: interaction.client.config.colors.orange,
        };
        if (interaction.deferred || interaction.replied) {
            return await interaction.editReply({ embeds: [embed] }).then(msg => {
                setTimeout(() => {
                    msg.delete().catch(() => { });
                }, time);
            });
        } else {
            return await interaction.reply({ embeds: [embed] }).then(msg => {
                setTimeout(() => {
                    msg.delete().catch(() => { });
                }, time);
            });
        }
    }
}
