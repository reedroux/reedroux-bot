import { Dispatcher } from './Dispatcher';
import { LoadType, type LavalinkResponse, type Player } from 'shoukaku';
import {
    ChannelType,
    Guild,
    GuildMember,
} from 'discord.js';

import BotClient from '../Client';

export class Queue extends Map {
    public client: BotClient;
    public player: Dispatcher | Player;
    public creating: boolean = false;
    constructor(client: BotClient) {
        super();
        this.client = client;
    }
    public getPlayer(guildId: string): Dispatcher {
        return this.get(guildId);
    }
    public checkURL(url: string): boolean {
        try {
            new URL(url);
            return true;
        } catch (e) {
            return false;
        }
    }
    public delete(guildId: string): boolean {
        return super.delete(guildId);
    }
    public set(guildId: string, dispatcher: Dispatcher | Player): this {
        return super.set(guildId, dispatcher);
    }
    public async createPlayer(options: createOptions): Promise<Dispatcher> {
        const dispatcher = this.getPlayer(options.guild.id);
        const node = this.client.shoukaku.options.nodeResolver(this.client.shoukaku.nodes);
        if (dispatcher) {
            const k = this.client.shoukaku.players.get(options.guild.id);
            if (k) this.client.shoukaku.leaveVoiceChannel(options.guild.id);
            let errored: boolean = false;
            const node = this.client.shoukaku.options.nodeResolver(this.client.shoukaku.nodes);
            if (node == undefined) return;
            const player = await this.client.shoukaku
                .joinVoiceChannel({
                    guildId: options.guild.id,
                    channelId: options.voiceChannelId,
                    shardId: options.guild.shard.id,
                    deaf: true,
                    mute: false,
                })
                .catch(async err => {
                    errored = true;
                    this.creating = false;
                    if (this.client.shoukaku.players.get(options.guild.id))
                        this.client.shoukaku.players.delete(options.guild.id);
                    //await ctx.errorMessage(`${this.client.emoji.deny} An error occurred while trying to join the voice channel.`);
                });
            if (errored || !player) {
                this.creating = false;

                return null;
            }
            dispatcher.player = player;
            dispatcher.textChannel = options.textChannelId;
            this.set(options.guild.id, dispatcher);
            let vol: number = 100;
            const data = await this.client.db.getDefaultVolume(options.guild.id);
            if (data && data.volume) vol = data.volume;
            player.setGlobalVolume(vol);
            return dispatcher;
        } else {
            if (!node) return;
            if (!options.voiceChannelId) return;
            if (!options.guild.shard) return;
            if (options.guild.members.me.voice.channel) this.client.shoukaku.leaveVoiceChannel(options.guild.id);
            const player = await this.client.shoukaku.joinVoiceChannel({
                guildId: options.guild.id,
                channelId: options.voiceChannelId,
                shardId: options.guild.shard.id,
                deaf: true,
            });
            let textChannelId = options?.textChannelId;
            const announce = await this.client.db.getAnnounce(options.guild.id);
            if (announce && announce.mode && announce.channelId) {
                textChannelId = options.guild.channels.cache.get(announce.channelId)
                    ? announce.channelId
                    : options.textChannelId;
            }
            if (
                options.voiceMember &&
                options.guild.members.me.voice &&
                options.voiceMember.voice.channel.type === ChannelType.GuildStageVoice
            ) {
                options.guild.members.me.voice.setSuppressed(false).catch(() => null);
            }
            const dispatcher = new Dispatcher(
                this.client,
                {
                    voiceChannelId: options.voiceChannelId,
                    textChannelId: textChannelId || null,
                    guild: options.guild,
                },
                player,
                node
            );
            let vol: number = 100;
            const data = await this.client.db.getDefaultVolume(options.guild.id);
            if (data && data.volume) vol = data.volume;
            player.setGlobalVolume(vol);
            this.set(options.guild.id, dispatcher);
            return dispatcher;
        }
    }

    public async search(query: string, source?: SourceType): Promise<LavalinkResponse> {
        const type = source || SourceType.JIO_SAAVAN;
        const node = this.client.shoukaku.options.nodeResolver(this.client.shoukaku.nodes);
        if (!node) return;
        const res = await node.rest.resolve(
            /^https?:\/\//.test(query) ? query : `${type}:${query}`
        );
        /* if (res && res.loadType === LoadType.ERROR || res.loadType === LoadType.EMPTY) {
            let fallbackSource: SourceType;
            switch (type) {
                case SourceType.YOUTUBE_MUSIC:
                    fallbackSource = SourceType.SPOTIFY;
                    break;
                case SourceType.SPOTIFY:
                    fallbackSource = SourceType.SOUNDCLOUD;
                    break;
                case SourceType.SOUNDCLOUD:
                    fallbackSource = SourceType.YOUTUBE;
                    break;
                case SourceType.YOUTUBE:
                    fallbackSource = SourceType.DEEZER;
                    break;
                case SourceType.DEEZER:
                    fallbackSource = SourceType.APPLE;
                    break;
                case SourceType.APPLE:
                    fallbackSource = SourceType.YOUTUBE_MUSIC;
                    break;
                default:
                    fallbackSource = SourceType.YOUTUBE_MUSIC;
                    break;
            }
            const fallbackRes = await node.rest.resolve(
                /^https?:\/\//.test(query) ? query : `${fallbackSource}:${query}`
            );
            if (!fallbackRes) {
                const res = await node.rest.resolve(
                    /^https?:\/\//.test(query) ? query : `${SourceType.YOUTUBE_MUSIC}:${query}`
                );
                if (!res) return;
                return res;
            }
            return fallbackRes;
        } */
        return res;
    }
}
export enum SourceType {
    SOUNDCLOUD = 'scsearch',
    SPOTIFY = 'spsearch',
    DEEZER = 'dzsearch',
    YANDEX = 'ymsearch',
    APPLE = 'amsearch',
    JIO_SAAVAN = 'jssearch',
}

type createOptions = {
    voiceChannelId: string;
    textChannelId: string;
    guild: Guild;
    voiceMember?: GuildMember;
};
