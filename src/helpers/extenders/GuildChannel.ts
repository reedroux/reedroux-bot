import {
    GuildChannel,
    ChannelType,
    PermissionFlagsBits,
    TextChannel,
    PermissionResolvable,
    Message,
} from 'discord.js';

declare module 'discord.js' {
    export interface TextChannel {
        safeSend(this: GuildChannel, content: any, seconds?: number): Promise<Message>;
    }
}
declare module 'discord.js' {
    export interface GuildChannel {
        canSendEmbeds(): boolean;
        safeSend(content: any, seconds?: number): Promise<Message | void>;
    }
}

GuildChannel.prototype.canSendEmbeds = function (this: GuildChannel): boolean {
    return (
        this.permissionsFor(this.guild!.members.me!)?.has([
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.EmbedLinks,
        ]) ?? false
    );
};

GuildChannel.prototype.safeSend = async function (
    this: GuildChannel,
    content: any,
    seconds?: number
): Promise<Message | void> {
    if (!content) return;
    if (this.type !== ChannelType.GuildText) return;

    const perms: PermissionResolvable[] = ['ViewChannel', 'SendMessages'];
    if (content.embeds && content.embeds.length > 0) perms.push('EmbedLinks');
    if (!this.permissionsFor(this.guild!.members.me!)?.has(perms)) return;

    try {
        if (this instanceof TextChannel) {
            if (!seconds) return await this.send(content);
            const reply = await this.send(content);
            setTimeout(() => reply.deletable && reply.delete().catch(ex => {}), seconds * 1000);
        }
    } catch (ex) {
        console.error(`safeSend`, ex);
    }
};
