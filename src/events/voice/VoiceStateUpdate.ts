import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ChannelType,
    EmbedBuilder,
    NewsChannel,
    TextChannel,
    VoiceChannel,
    VoiceState,
} from 'discord.js';
import { BotClient, Event } from '../../structures/index';

export default class VoiceStateUpdate extends Event {
    constructor(client: BotClient, file: string) {
        super(client, file, {
            name: 'voiceStateUpdate',
        });
    }

    private async handleVoiceChannelEmpty(player: any, voiceChannel: VoiceChannel, oldState: VoiceState, newState: VoiceState): Promise<void> {
        if (!player || !voiceChannel) return;

        const voiceMembers = voiceChannel.members.filter(member => !member.user.bot);
        if (voiceMembers.size > 0) return;

        if (player.leaveTimeout) clearTimeout(player.leaveTimeout);

        const embed = new EmbedBuilder()
            .setTitle('Voice Channel Empty')
            .setDescription(
                `\`❗\` I left <#${oldState.guild.members.me.voice.channel?.id}> because I was left alone.\n\nTo enable 24/7 mode, use the \`24/7\` command.\nUnlock more features with Premium.`
            )
            .setColor(this.client.config.colors.main);

        if (player.player) player.destroy(true);

        const textchannel = newState.guild.channels.cache.get(player.textChannel!) as TextChannel | NewsChannel;
        const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
                .setStyle(ButtonStyle.Link)
                .setLabel('Premium')
                .setURL(this.client.config.links.patreon),
            new ButtonBuilder()
                .setStyle(ButtonStyle.Link)
                .setLabel('Vote')
                .setURL(this.client.config.links.vote)
        );

        if (!textchannel) return;

        await textchannel
            .send({
                embeds: [embed],
                components: [buttonRow],
            })
            .then(msg => {
                player.waitingMessage = msg.id;
            })
            .catch(() => { });
    }

    public async run(oldState: VoiceState, newState: VoiceState): Promise<void> {
        const player = this.client.queue.getPlayer(newState.guild.id);
        if (!player) return;

        let type: 'join' | 'leave' | 'move' | 'disconnect';

        if (!oldState.channelId && newState.channelId) type = 'join';
        if (oldState.channelId && !newState.channelId) type = 'leave';
        if (oldState.channelId && newState.channelId && oldState.channelId !== newState.channelId) type = 'move';
        if (!oldState.guild.members.me.voice.channel && !newState.guild.members.me.voice.channel) type = 'disconnect';

        if (type === 'disconnect' && player) {
            const voiceChannel = newState.guild.channels.cache.get(player.metadata.voiceChannelId) as VoiceChannel;
            await this.handleVoiceChannelEmpty(player, voiceChannel, oldState, newState);
            return;
        }

        if (newState.guild.members.me.voice.channel.members.filter(member => !member.user.bot).size >= 1) {
            if (player.waitingMessage) {
                const channel = newState.guild.channels.cache.get(player.textChannel!);
                if (channel instanceof TextChannel || channel instanceof NewsChannel) {
                    const msg = await channel.messages.fetch(player.waitingMessage);
                    if (msg) {
                        await msg.delete().catch(() => { });
                        player.waitingMessage = null;
                    }
                }
            }
        }

        const _247 = await this.client.db.get247(newState.guild.id);
        const voiceMembers = newState.guild.members.me.voice.channel.members.filter(member => !member.user.bot).size;

        switch (type) {
            case 'join':
                if (player) {
                    player.leaveTimeout && clearTimeout(player.leaveTimeout);
                }
                break;

            case 'leave':
                if (player && player.metadata.voiceChannelId === oldState.guild.members.me.voice.channel.id) {
                    if (!voiceMembers && voiceMembers === 0) {
                        if (player.leaveTimeout) clearTimeout(player.leaveTimeout);
                        if (_247 && _247.mode) {
                            setTimeout(async () => {
                                if (player && player.player) player.stop();
                            }, 160000).unref();
                        } else {
                            player.leaveTimeout = setTimeout(async () => {
                                await this.handleVoiceChannelEmpty(player, oldState.guild.channels.cache.get(player.metadata.voiceChannelId) as VoiceChannel, oldState, newState);
                            }, 6000).unref();
                        }
                    }
                }
                break;

            case 'move':
                if (newState.member.id === this.client.user?.id) {
                    if (newState.id === this.client.user.id && newState.channelId && newState.channel.type === ChannelType.GuildStageVoice && newState.guild.members.me.voice.suppress) {
                        if (newState.guild.members.me.permissions.has(['Connect', 'Speak']) || newState.channel.permissionsFor(newState.guild.members.me).has('MuteMembers')) {
                            await newState.guild.members.me.voice.setSuppressed(false).catch(() => { });
                        }
                    }
                    if (newState.channelId && player && player.metadata.voiceChannelId !== newState.channelId) {
                        player.metadata.voiceChannelId = newState.channelId;
                    }
                    if (player) {
                        player.leaveTimeout && clearTimeout(player.leaveTimeout);
                    }
                    if (!voiceMembers && voiceMembers === 0) {
                        if (player.leaveTimeout) clearTimeout(player.leaveTimeout);
                        if (_247 && _247.mode) {
                            setTimeout(async () => {
                                if (player && player.player) player.stop();
                            }, 160000).unref();
                        } else {
                            player.leaveTimeout = setTimeout(async () => {
                                await this.handleVoiceChannelEmpty(player, oldState.guild.channels.cache.get(player.metadata.voiceChannelId) as VoiceChannel, oldState, newState);
                            }, 60000).unref();
                        }
                    }
                }
                break;
        }
    }
}
