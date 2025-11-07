import {
    Guild,
    ChannelType,
    GuildChannel,
    Role,
    GuildMember,
    GuildMemberManager,
    GuildBasedChannel,
} from 'discord.js';

const ROLE_MENTION = /<?@?&?(\d{17,20})>?/;
const CHANNEL_MENTION = /<?#?(\d{17,20})>?/;
const MEMBER_MENTION = /<?@?!?(\d{17,20})>?/;

declare module 'discord.js' {
    export interface Guild {
        findMatchingChannels(query: string, type?: ChannelType[]): GuildChannel[];
        findMatchingVoiceChannels(query: string, type?: ChannelType[]): GuildChannel[];
        findMatchingRoles(query: string): Role[];
        resolveMember(query: string, exact?: boolean): Promise<GuildMember | undefined>;
        fetchMemberStats(): Promise<number[]>;
    }
}

Guild.prototype.findMatchingChannels = function (
    this: Guild,
    query: string,
    type: ChannelType[] = [ChannelType.GuildText, ChannelType.GuildAnnouncement]
): GuildChannel[] {
    if (!this || !query || typeof query !== 'string') return [];

    const channelManager = this.channels.cache.filter((ch: GuildBasedChannel) => {
        if (ch instanceof GuildChannel) {
            return type.includes(ch.type);
        }
        return false;
    });

    const patternMatch = query.match(CHANNEL_MENTION);
    if (patternMatch) {
        const id = patternMatch[1];
        const channel = channelManager.find((r: GuildBasedChannel) => {
            if (r instanceof GuildChannel) {
                return r.id === id;
            }
            return false;
        });
        if (channel) return [channel as GuildChannel];
    }

    const exact: GuildChannel[] = [];
    const startsWith: GuildChannel[] = [];
    const includes: GuildChannel[] = [];
    channelManager.forEach((ch: GuildBasedChannel) => {
        if (ch instanceof GuildChannel) {
            const lowerName = ch.name.toLowerCase();
            if (ch.name === query) exact.push(ch);
            if (lowerName.startsWith(query.toLowerCase())) startsWith.push(ch);
            if (lowerName.includes(query.toLowerCase())) includes.push(ch);
        }
    });

    if (exact.length > 0) return exact;
    if (startsWith.length > 0) return startsWith;
    if (includes.length > 0) return includes;
    return [];
};

Guild.prototype.findMatchingVoiceChannels = function (
    this: Guild,
    query: string,
    type: ChannelType[] = [ChannelType.GuildVoice, ChannelType.GuildStageVoice]
): GuildChannel[] {
    if (!this || !query || typeof query !== 'string') return [];

    const channelManager = this.channels.cache.filter((ch: GuildBasedChannel) => {
        if (ch instanceof GuildChannel) {
            return type.includes(ch.type);
        }
        return false;
    });

    const patternMatch = query.match(CHANNEL_MENTION);
    if (patternMatch) {
        const id = patternMatch[1];
        const channel = channelManager.find((r: GuildBasedChannel) => {
            if (r instanceof GuildChannel) {
                return r.id === id;
            }
            return false;
        });
        if (channel) return [channel as GuildChannel];
    }

    const exact: GuildChannel[] = [];
    const startsWith: GuildChannel[] = [];
    const includes: GuildChannel[] = [];
    channelManager.forEach((ch: GuildBasedChannel) => {
        if (ch instanceof GuildChannel) {
            const lowerName = ch.name.toLowerCase();
            if (ch.name === query) exact.push(ch);
            if (lowerName.startsWith(query.toLowerCase())) startsWith.push(ch);
            if (lowerName.includes(query.toLowerCase())) includes.push(ch);
        }
    });

    if (exact.length > 0) return exact;
    if (startsWith.length > 0) return startsWith;
    if (includes.length > 0) return includes;
    return [];
};

Guild.prototype.findMatchingRoles = function (query: string): Role[] {
    if (!this || !query || typeof query !== 'string') return [];

    const patternMatch = query.match(ROLE_MENTION);
    if (patternMatch) {
        const id = patternMatch[1];
        const role = this.roles.cache.find(r => r.id === id);
        if (role) return [role];
    }

    const exact = [];
    const startsWith = [];
    const includes = [];
    this.roles.cache.forEach(role => {
        const lowerName = role.name.toLowerCase();
        if (role.name === query) exact.push(role);
        if (lowerName.startsWith(query.toLowerCase())) startsWith.push(role);
        if (lowerName.includes(query.toLowerCase())) includes.push(role);
    });
    if (exact.length > 0) return exact;
    if (startsWith.length > 0) return startsWith;
    if (includes.length > 0) return includes;
    return [];
};

Guild.prototype.resolveMember = async function (
    this: Guild,
    query: string,
    exact = false
): Promise<GuildMember | undefined> {
    if (!query || typeof query !== 'string') return;

    // Check if mentioned or ID is passed
    const patternMatch = query.match(MEMBER_MENTION);
    if (patternMatch) {
        const id = patternMatch[1];
        const fetched = await this.members.fetch({ user: id }).catch(() => {});
        if (fetched) return fetched;
    }

    // Fetch and cache members from API
    await this.members.fetch({ query }).catch(() => {});

    // Check if exact tag is matched
    const matchingTags = this.members.cache.filter(mem => mem.user.tag === query);
    if (matchingTags.size === 1) return matchingTags.first();

    // Check for matching username
    if (!exact) {
        return this.members.cache.find(
            x =>
                x.user.username === query ||
                x.user.username.toLowerCase().includes(query.toLowerCase()) ||
                x.displayName.toLowerCase().includes(query.toLowerCase())
        );
    }
};

Guild.prototype.fetchMemberStats = async function () {
    const all = await this.members.fetch({
        force: false,
        cache: false,
    });
    const total = all.size;
    const bots = all.filter(mem => mem.user.bot).size;
    const members = total - bots;
    return [total, bots, members];
};
