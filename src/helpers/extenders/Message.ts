import {
    Message,
    BaseMessageOptions,
    MessagePayload,
    ChannelType,
    PermissionResolvable,
} from 'discord.js';

declare module 'discord.js' {
    export interface Message {
        prefix: string;
        safeReply(
            content: BaseMessageOptions | MessagePayload | string,
            seconds?: number
        ): Promise<Message | void>;
    }
}

Message.prototype.safeReply = async function (
    this: Message,
    content: BaseMessageOptions | MessagePayload | string,
    seconds?: number
): Promise<Message<boolean>> {
    if (!content) return;

    const perms: PermissionResolvable[] = ['ViewChannel', 'SendMessages'];

    if (typeof content !== 'string' && 'embeds' in content && content.embeds.length > 0)
        perms.push('EmbedLinks');

    if (
        this.channel.type !== ChannelType.DM &&
        !this.channel.permissionsFor(this.guild!.members.me!)?.has(perms)
    )
        return;

    perms.push('ReadMessageHistory');
    if (
        this.channel.type !== ChannelType.DM &&
        !this.channel.permissionsFor(this.guild!.members.me!)?.has(perms)
    ) {
        if ('safeSend' in this.channel) {
            this.channel.safeSend(content, seconds);
            return;
        }
    }

    try {
        if (!content) return;
        if (!seconds) return await this.reply(content);
        const reply = await this.reply(content).then((msg) => msg).catch(() => null);
        setTimeout(() => reply?.deletable && reply?.delete().catch(() => { }), seconds * 1000);
    } catch (ex) {
        console.error(`safeReply`, ex);
    }
};
