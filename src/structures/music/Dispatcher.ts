import type { User, TextChannel, Guild, GuildMember } from 'discord.js';
import type { Player, Track, Node, TrackEndEvent } from 'shoukaku';
import { BotClient } from '../index';
import { handleMusic } from '../../handlers';
import { updateTrack, updateVoiceStatus } from '../../helpers/player/Update';

export enum LoopMode {
    Song = 'song',
    Queue = 'queue',
    Off = 'off',
}

export const filters = [
    '8D',
    'bassboost',
    'nightcore',
    'vaporwave',
    'channelmix',
    'electronic',
    'jazz',
    'lowpass',
    'pitch',
    'pop',
    'lofi',
    'radio',
    'rock',
    'speed',
    'soft',
    'treblebass',
    'rotation',
    'karaoke',
    'reverse',
    'tremolo',
    'vibrato',
] as const;

class dispatcherMetadata {
    textChannelId: string;
    voiceChannelId: string;
    guild: Guild;
}
export class Dispatcher {
    public leaveTimeout: NodeJS.Timeout;
    public player: Player;
    public metadata: dispatcherMetadata;
    public textChannel: string;
    public client: BotClient;
    public node: Node;
    public user: User;
    public lastMessage: string;
    public waitingMessage: string;
    public queue: Array<Song>;
    public currentTrack: Song | null;
    public previousTracks: Song[];
    public playing: boolean;
    public paused: boolean;
    public stopped: boolean;
    public matchedTracks: Array<Track>;
    public shuffle: boolean;
    public repeat: LoopMode;
    public backed: boolean;
    public filters: (typeof filters)[any][];
    public instantSkipMode: boolean;
    public instantSkipPosition: number;
    public timeout: any;
    public errors: number;
    public errored: string;
    private noFailureMode: any;
    public voting: boolean;
    public autoplay: boolean;
    public history: Song[] = [];
    public trackStartAt: number;
    public queueEndMessage: string;
    public forceDisconnect: boolean;
    public constructor(
        client: BotClient,
        metadata: dispatcherMetadata,
        player: Player,
        node: Node
    ) {
        this.player = player;
        this.textChannel = metadata.textChannelId;
        this.client = client;
        this.node = node;
        this.metadata = metadata;
        this.queue = [];
        this.filters = [];
        this.playing = false;
        this.paused = false;
        this.stopped = false;
        this.matchedTracks = [];
        this.shuffle = false;
        this.autoplay = false;
        this.repeat = LoopMode.Off;
        this.instantSkipMode = false;
        this.currentTrack = null;
        this.previousTracks = [];
        this.voting = false;
        this.errors = 0;
        this.noFailureMode = null;
        this.backed = false;
        this.forceDisconnect = false;
        this.player.on('start', async () => {
            if (this.noFailureMode) return;
            if (this.playing && this.currentTrack) {
                this.trackStartAt = Date.now();
                await new handleMusic().trackStart(this.client, this, this.currentTrack);
            }
        });
        this.player.on('end', async (op: TrackEndEvent) => {
            if (!this.queue.length) {
                await new handleMusic().queueEnd(this.client, this, this.currentTrack, op);
            } else {
                await new handleMusic().trackEnd(this.client, this, this.currentTrack, op);
            }
        });

        this.player.on('stuck', () => {
            this.client.logger.error('Track stuck');
            this.errors++;
            if (this.errors > 3) {
                this.destroy();
            }
        });
        this.player.on('closed', pocket => {
            /* console.log(pocket);
            if (pocket.reason === "Disconnected.") {
                setTimeout(() => {
                    if (this.forceDisconnect) {
                        console.log("Force disconnect");
                        this.destroy(true);
                        this.forceDisconnect = false;
                    }
                }, 3000).unref();
            } */
        });
        this.player.on('exception', error => {
            this.errored = 'yes';
            this.client.logger.error('Track exception');
            this.errors++;
            if (this.errors > 3) {
                this.destroy(true);
            }
            this.client.logger.error(JSON.stringify(error));
        });
    }
    public get position(): number {
        return this.player.position;
    }
    public get volume() {
        return this.player.volume;
    }
    public async deleteLastMessage() {
        const prunning = await this.client.db.getAnnounce(this.metadata.guild.id);
        if (prunning && prunning.prunning && this.lastMessage) {
            const channel = this.client.channels.cache.get(
                this.metadata.textChannelId
            ) as TextChannel | undefined; // Specify type or undefined
            if (channel) {
                try {
                    const msg = await channel.messages.fetch(this.lastMessage);
                    if (msg) {
                        await msg.delete();
                    }
                } catch (error) {
                    console.error("Error fetching or deleting message:", error);
                }
            }
        } else {
            if (this.lastMessage) {
                const channel = this.client.channels.cache.get(
                    this.metadata.textChannelId
                ) as TextChannel | undefined; // Specify type or undefined
                if (channel) {
                    try {
                        const msg = await channel.messages.fetch(this.lastMessage);
                        if (msg) {
                            await msg.delete();
                        }
                    } catch (error) {
                        console.error("Error fetching or deleting message:", error);
                    }
                }
            }
        }
        return true;
    }
    public get exists() {
        return this.client.queue.has(this.metadata.guild.id);
    }
    public play(): Promise<void> {
        if (!this.exists || (!this.queue.length && !this.currentTrack)) return;
        this.currentTrack = this.queue.length !== 0 ? this.queue.shift() : this.queue[0];
        if (!this.currentTrack) return;
        this.player.playTrack({
            track: { encoded: this.currentTrack?.encoded },
        });
        if (this.currentTrack) {
            this.history.push(this.currentTrack);
            if (this.history.length > 100) {
                this.history.shift();
            }
        }
        this.playing = true;
        this.stopped = false;
        this.paused = false;
    }

    public skip(skipto?: number): Promise<void> {
        if (this.instantSkipMode) return;
        if (!this.player) return;
        if (skipto > 1) {
            if (skipto > this.queue.length) {
                this.queue.length = 0;
            } else {
                this.queue.splice(0, skipto - 1);
            }
        }
        this.player.stopTrack();
        updateTrack(this, this.client);
    }
    public pause(value: boolean) {
        if (!this.player) return;
        if (this.paused === value) return;
        this.player.setPaused(value);
        if (value === false) {
            if (this.errored === 'yes') {
                this.timeout = setTimeout(() => {
                    if (!this.exists || this.stopped) return;
                    if (!this.currentTrack) return;
                }, this.currentTrack.info.length - this.player.position);
            }
        } else {
            if (this.errored === 'yes') this.timeout && clearTimeout(this.timeout);
        }
        this.paused = value;
        updateTrack(this, this.client, true);
        updateVoiceStatus(this, this.client);
        return value;
    }
    public setVolume(value: number): Promise<void> {
        if (value < 0 || value > 200) return;
        this.player.setGlobalVolume(value);
        updateTrack(this, this.client);
    }
    public setShuffle(): void {
        if (!this.player) return;
        const queue = this.queue;
        for (let i = queue.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [queue[i], queue[j]] = [queue[j], queue[i]];
        }
        this.queue = queue;
        updateTrack(this, this.client);
    }
    public seek(value: number): void {
        if (!this.player) return;
        this.player.seekTo(value);
    }
    public stop(): void {
        this.queue.length = 0;
        this.previousTracks = [];
        this.history = [];
        this.playing = false;
        this.stopped = true;
        this.paused = false;
        this.repeat = LoopMode.Off;
        this.player.stopTrack();
        updateTrack(this, this.client, true);
    }

    public clearQueue(): void {
        if (!this.player) return;
        this.queue.splice(0, this.queue.length);
        this.previousTracks = [];
    }
    public playPrevious(): void {
        if (!this.player) return;
        if (!this.previousTracks) return;
        this.queue.unshift(this.previousTracks[this.previousTracks.length - 1]);
        this.skip();
        this.previousTracks = this.previousTracks.filter(
            e => e && e.info && e.info.uri !== this.previousTracks[this.previousTracks.length - 1].info.uri
        );
        this.backed = true;
    }
    public remove(song: any, mode: boolean) {
        if (!mode && isNaN(song)) {
            this.queue = this.queue.filter(t => t.info.uri !== song.info.uri);
        } else {
            const track = this.queue[song];
            if (!track) return;
            this.queue = this.queue.filter(t => t.info.uri !== track.info.uri);
        }
        return true;
    }
    public addTrack(track?: Song, user?: User, addTop?: boolean) {
        let song = track;
        if (user) song = new Song(track, user);
        addTop && this.queue.length ? this.queue.splice(0, 0, song) : this.queue.push(song);
        if (!this.playing) this.play();
        return song;
    }

    public async Autoplay(song: Song) {
        if (!song || !song.info) return;
        try {
            const resolve = await this.client.shoukaku.options
                .nodeResolver(this.client.shoukaku.nodes)
                .rest.resolve(
                    (() => {
                        if (song.info.sourceName === 'spotify') {
                            return `spsearch:${song.info.author}`;
                        }
                        if (song.info.sourceName === 'youtube') {
                            return `ytsearch:${song.info.author}`;
                        }
                        if (song.info.sourceName === 'soundcloud') {
                            return `scsearch:${song.info.author}`;
                        }
                        if (song.info.sourceName === 'deezer') {
                            return `dzsearch:${song.info.author}`;
                        }
                        if (song.info.sourceName === 'applemusic') {
                            return `amsearch:${song.info.author}`;
                        }
                    })()
                );

            if (!resolve || !resolve.data || !Array.isArray(resolve.data)) {
                console.error('Failed to fetch node resolve data.');
                return this.destroy();
            }

            let choosed: Song | null = null;
            const maxAttempts = 10;
            let attempts = 0;
            const metadata = resolve.data as Array<any> as any;

            while (attempts < maxAttempts) {
                const potentialChoice = new Song(
                    metadata[Math.floor(Math.random() * metadata.length)],
                    this.client.user
                );
                if (
                    !this.queue.some(s => s.encoded === potentialChoice.encoded) &&
                    !this.history.some(s => s.encoded === potentialChoice.encoded)
                ) {
                    choosed = potentialChoice;
                    break;
                }
                attempts++;
            }

            if (choosed) {
                this.queue.push(choosed);
                return this.checkToPlay();
            }
        } catch (error) {
            return this.destroy();
        }
    }

    public setAutoplay(value: boolean) {
        this.autoplay = value;
        updateTrack(this, this.client);
    }

    public setRepeat(): LoopMode {
        if (!this.player) return;
        if (this.repeat === LoopMode.Off) {
            this.repeat = LoopMode.Song;
        } else if (this.repeat === LoopMode.Song) {
            this.repeat = LoopMode.Queue;
        } else {
            this.repeat = LoopMode.Off;
        }
        updateTrack(this, this.client, true);

        return this.repeat;
    }

    public async destroy(force?: boolean) {
        if (!force) {
            this.backed = false;
            if (this.playing && this.player) {
                this.instantSkipPosition = this.player.position;
                this.playing = false;
            }
            this.playing = false;
            this.client.shoukaku.leaveVoiceChannel(this.metadata.guild.id);
            this.client.queue.delete(this.metadata.guild.id);
        } else {
            this.queue.length = 0;
            this.playing && this.player.stopTrack();
            this.repeat = LoopMode.Off;
            this.currentTrack = null;
            this.backed = false;
            this.playing = false;
            this.history = [];
            this.timeout && clearTimeout(this.timeout);
            this.client.shoukaku.leaveVoiceChannel(this.metadata.guild.id);
            this.client.queue.delete(this.metadata.guild.id);
        }
        await new handleMusic().destroy(this.client, this);
    }

    public checkToPlay() {
        if (this.queue.length && !this.currentTrack && !this.player.paused) {
            this.play();
        }
    }
}

function readable(title: string): string {
    return (
        title
            .replace(/!/g, '')
            .replace(/@/g, '')
            .replace(/#/g, '')
            .replace(/\$/g, '')
            .replace(/%/g, '')
            .replace(/\^/g, '')
            .replace(/&/g, '')
            .replace(/\*/g, '')
            .replace(/\(/g, '')
            .replace(/\)/g, '')
            .replace(/_/g, '')
            .replace(/\+/g, '')
            .replace(/=/g, '')
            .replace(/{/g, '')
            .replace(/\[/g, '')
            .replace(/}/g, '')
            .replace(/]/g, '')
            .replace(/\|/g, '-')
            .replace(/:/g, '')
            .replace(/;/g, '')
            .replace(/"/g, '')
            .replace(/'/g, '')
            .replace(/</g, '')
            .replace(/,/g, '')
            .replace(/>/g, '')
            .replace(/\./g, '')
            .replace(/\?/g, '')
            .replace(/\//g, '')
            .replace(/\\/g, '')
            .replace(/~/g, '')
            .replace(/`/g, '')
            .replace(/Official Video/g, '')
            .replace(/Official Music Video/g, '')
            .replace(/Official Lyric Video/g, '')
            .replace(/Official Audio/g, '')
            .replace(/Official/g, '')
            .replace(/Music Video/g, '')
            .replace(/Lyric Video/g, '')
            .replace(/Lyrics Video/g, '')
            .replace(/Lyrics/g, '')
            .replace(/\(Official Music Video\)/g, '')
            .replace(/\(Official Video\)/g, '')
            .replace(/\(Full Album\)/g, '')
            .replace(/\(Full Video\)/g, '')
            .replace(/\(Official Audio\)/g, '')
            .replace(/\(Clip Official\)/g, '')
            .replace(/\(Official Lyric Video\)/g, '')
            .replace(/\(Lyric Video\)/g, '')
            .replace(/\(Lyrics\)/g, '')
            .replace(/\(Lyric Video\)/g, '')
            .replace(/\(Lyrics Video\)/g, '')
            .replace(/\(Audio\)/g, '')
            .replace(/\(Video\)/g, '')
            .replace(/\(Clip\)/g, '')
            .replace(/Music Video/g, '')
            .replace(/\(Official Music Video\)/g, '')
            .replace(/\(Official Video\)/g, '')
            .replace(/\(Official Audio\)/g, '')
            .replace(/\(Clip Official\)/g, '')
            .replace(/\(Official Lyric Video\)/g, '')
            .replace(/\(Lyric Video\)/g, '')
            .replace(/\(Lyrics\)/g, '')
            .replace(/\(Lyric Video\)/g, '')
            .replace(/\(Lyrics Video\)/g, '')
            .replace(/HD/g, '')
            .replace(/4K/g, '')
            .replace(/1080p/g, '')
            .replace(/720p/g, '')
            .replace(/MV/g, '')
            .replace(/Extended Version/g, '')
            .replace(/Official Song/g, '')
            .replace(/Remastered/g, '')
            .replace(/Audio Only/g, '')
            .replace(/NEW/g, '')
            .replace(/Out Now/g, '')
            .replace(/Exclusive/g, '')
            .replace(/Full Album/g, '')
            .replace(/Full Song/g, '')
            .replace(/Complete Version/g, '')
            .replace(/Original/g, '')
            .replace(/HD Quality/g, '')
            .replace(/Featuring/g, '')
            .replace(/ft\./g, '')
            .replace(/feat\./g, '')
            .replace(/ft/g, '')
            .replace(/feat/g, '')
            .replace(/Official/g, '')
            .replace(/Video/g, '')
            .replace(/Music/g, '')
            .replace(/Song/g, '')
            .replace(/Audio/g, '')
            .replace(/Lyric/g, '')
            .replace(/Lyrics/g, '')
            .replace(/Cover/g, '')
            .replace(/title/g, '')
            .replace(/Full Video/g, '')
            .replace(/Full Song/g, '')
            .replace(/FULL VIDEO/g, '')
            .replace(/Cover Art/g, '')
            .replace(/Cover Version/g, '')
            .replace(/Cover Song/g, '')
            // eslint-disable-next-line no-control-regex
            .trim()
    );
}
function sanitize(text: string): string {
    readable(text);
    text = text.replace(/ - Topic$/, "").trim();
    const allUppercase = text.split(/\s+/).every(word => word === word.toUpperCase());
    if (allUppercase) text = text.toLowerCase().replace(/\b\w/g, char => char.toUpperCase());
    const words = text.split(/\s+/);
    if (words.length > 8) text = words.slice(0, 8).join(" ") + "...";
    text = text.replace(/,\s*&\s*/g, ", ");
    return text;
}

export enum State {
    CONNECTING,
    NEARLY,
    CONNECTED,
    RECONNECTING,
    DISCONNECTING,
    DISCONNECTED,
}

export class Song implements Track {
    encoded: string;
    info: {
        identifier: string;
        isSeekable: boolean;
        author: string;
        length: number;
        isStream: boolean;
        position: number;
        title: string;
        uri?: string;
        artworkUrl?: string;
        isrc?: string;
        sourceName: string;
        requester: User | GuildMember;
    };
    pluginInfo: any;

    constructor(track: Song | Track, user: User | GuildMember) {
        if (!track) throw new Error('Track is not provided');
        this.encoded = track.encoded;
        this.info = {
            ...track.info,
            // if author is have multiple then remove the second one (author, author2) => author
            author: track.info.author.split(',').shift() || 'Unknown',
            title: sanitize(track.info.title),
            requester: user,
        };
        this.pluginInfo = track.pluginInfo;
        if (this.info && this.info.requester === undefined) {
            this.info.requester.avatarURL({ extension: 'png', size: 512 });
        }
        if (this.info.sourceName === 'youtube') {
            this.info.title = readable(this.info.title);
            this.info.uri = `https://google.com/search?q=${encodeURIComponent(`${this.info.title}`)}`;
        }
    }
}
