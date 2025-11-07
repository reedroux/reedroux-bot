import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ChannelType,
    ChatInputCommandInteraction,
    EmbedBuilder,
    GuildMember,
    Message,
    ContextMenuCommandInteraction,
    User,
} from 'discord.js';
import { isPremiumOrGuild, isDJUser, isUserPremiumOrVote } from '../../helpers/Checkes';

export function MusicCheck(options?: {
    inVoice?: boolean;
    sameVoice?: boolean;
    player?: {
        isPlayer?: boolean;
        requireQueue?: boolean;
        requireCurrentSong?: boolean;
    }
    isDJ?: boolean;
    isVote?: boolean;
    isPremium?: boolean;
}) {
    return function (target: Object, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
        if (options === undefined) options = {};
        if (options.inVoice === undefined) options.inVoice = true;
        if (options.sameVoice === undefined) options.sameVoice = true;
        if (options.player === undefined) options.player = {};
        if (options.isDJ === undefined) options.isDJ = false;
        if (options.isVote === undefined) options.isVote = false;
        if (options.isPremium === undefined) options.isPremium = false;
        if (options.player.isPlayer === undefined) options.player.isPlayer = false;
        if (options.player.requireQueue === undefined) options.player.requireQueue = false;
        if (options.player.requireCurrentSong === undefined) options.player.requireCurrentSong = false;
        if (options.player.requireCurrentSong === true) options.player.isPlayer = true;
        if (options.player.requireQueue === true) options.player.isPlayer = true;

        const { inVoice, sameVoice, isDJ, isVote, isPremium } = options;
        const { isPlayer, requireQueue, requireCurrentSong } = options.player;

        const originalMethod = descriptor.value;

        descriptor.value = async function (...args: any[]) {
            const ctx: ChatInputCommandInteraction | Message = args[0];
            const embed = new EmbedBuilder().setAuthor({
                name:
                    ctx.member.user instanceof User
                        ? ctx.member.user.globalName || ctx.member.user.username
                        : null,
                iconURL: ctx.member.user instanceof User ? ctx.member.user.avatarURL() : null,
            });
            if (ctx.member instanceof GuildMember) {
                if (inVoice && !ctx.member.voice.channel) {
                    const errMsg = `\`⛔\` You have to be connected to a voice channel on this server to use this command!\n\n- How to join a voice channel? Just click on a channel with a speaker icon (for example, click here:  <#${ctx.guild.channels.cache.filter(c => c.type == ChannelType.GuildVoice).first()?.id}>) [See the official Discord guide](https://support.discord.com/hc/en-us/articles/360045138571-Beginner-s-Guide-to-Discord#h_9de92bc2-3bca-459f-8efd-e1e2739ca4f4)`;
                    await (ctx instanceof ChatInputCommandInteraction ||
                        ctx instanceof ContextMenuCommandInteraction
                        ? ctx.reply({
                            embeds: [
                                embed
                                    .setColor(ctx.client.config.colors.red)
                                    .setDescription(errMsg),
                            ],
                            ephemeral: true,
                        })
                        : ctx.safeReply({
                            embeds: [
                                embed
                                    .setColor(ctx.client.config.colors.red)
                                    .setDescription(errMsg),
                            ],
                        }, 30));
                    return;
                }

                if (
                    sameVoice &&
                    ctx.guild.members.me.voice.channel &&
                    !ctx.guild.members.me.voice.channel.equals(ctx.member.voice.channel)
                ) {
                    // check if is bot voice channel is have member voice channel if not then move bot to member voice channel
                    const voiceMembers = ctx.guild.members.me.voice.channel.members.filter(
                        member => !member.user.bot
                    ).size;
                    const player = ctx.client.queue.getPlayer(ctx.guild.id);
                    if (voiceMembers === 0 && player) {
                        const connection = ctx.client.shoukaku.connections.get(ctx.guild.id);
                        connection.setVoiceChannel(ctx.member.voice.channel.id);
                    } else {
                        const errMsg = `\`⛔\` You must be in the same voice ${ctx.guild.members.me.voice.channel} channel as me to use this command!`;
                        await (ctx instanceof ChatInputCommandInteraction ||
                            ctx instanceof ContextMenuCommandInteraction
                            ? ctx.reply({
                                embeds: [
                                    embed
                                        .setColor(ctx.client.config.colors.red)
                                        .setDescription(errMsg),
                                ],
                                ephemeral: true,
                            })
                            : ctx.safeReply({
                                embeds: [
                                    embed
                                        .setColor(ctx.client.config.colors.red)
                                        .setDescription(errMsg),
                                ],
                            }, 30));
                        return;
                    }
                }
            }
            const errorMsgs = {
                noPlayer: `\`⛔\` I'm not connected to a voice channel. Please use the ${await ctx.client.printCmd('join')} command to summon me!`,
                noQueue: `\`⛔\` There is no queue. Please use the ${await ctx.client.printCmd('play')} command to add a song to the queue.`,
                noSongPlaying: `\`⛔\` There is no song playing. Please use the ${await ctx.client.printCmd('play')} command to add a song to the queue.`,
            };

            if (isPlayer) {
                const player = ctx.client.queue.getPlayer(ctx.guild.id);

                if (!player) {
                    await (ctx instanceof ChatInputCommandInteraction ||
                        ctx instanceof ContextMenuCommandInteraction
                        ? ctx.reply({
                            embeds: [
                                embed
                                    .setColor(ctx.client.config.colors.red)
                                    .setDescription(errorMsgs.noPlayer),
                            ],
                            ephemeral: true,
                        })
                        : ctx.safeReply({
                            embeds: [
                                embed
                                    .setColor(ctx.client.config.colors.red)
                                    .setDescription(errorMsgs.noPlayer),
                            ],
                        }, 30));
                    return;
                }
            }
            if (requireQueue || requireCurrentSong) {
                const player = ctx.client.queue.getPlayer(ctx.guild.id);
                if (!player.queue) {
                    await (ctx instanceof ChatInputCommandInteraction ||
                        ctx instanceof ContextMenuCommandInteraction
                        ? ctx.reply({
                            embeds: [
                                embed
                                    .setColor(ctx.client.config.colors.red)
                                    .setDescription(errorMsgs.noQueue),
                            ],
                            ephemeral: true,
                        })
                        : ctx.safeReply({
                            embeds: [
                                embed
                                    .setColor(ctx.client.config.colors.red)
                                    .setDescription(errorMsgs.noQueue),
                            ],
                        }, 30));
                    return;
                }

                if (!player.currentTrack) {
                    await (ctx instanceof ChatInputCommandInteraction ||
                        ctx instanceof ContextMenuCommandInteraction
                        ? ctx.reply({
                            embeds: [
                                embed
                                    .setColor(ctx.client.config.colors.red)
                                    .setDescription(errorMsgs.noSongPlaying),
                            ],
                            ephemeral: true,
                        })
                        : ctx.safeReply({
                            embeds: [
                                embed
                                    .setColor(ctx.client.config.colors.red)
                                    .setDescription(errorMsgs.noSongPlaying),
                            ],
                        }, 30));
                    return;
                }
            }

            if (isDJ) {
                const isDJUserHave = await isDJUser(
                    ctx.client,
                    ctx.guildId,
                    ctx.member instanceof GuildMember ? ctx.member : null
                );
                if (!isDJUserHave) {
                    const errMsg = `\`⛔\` You need the DJ role or Manage Server permission to use this command.`;
                    await (ctx instanceof ChatInputCommandInteraction ||
                        ctx instanceof ContextMenuCommandInteraction
                        ? ctx.reply({
                            embeds: [
                                embed
                                    .setColor(ctx.client.config.colors.red)
                                    .setDescription(errMsg),
                            ],
                            ephemeral: true,
                        })
                        : ctx.safeReply({
                            embeds: [
                                embed
                                    .setColor(ctx.client.config.colors.red)
                                    .setDescription(errMsg),
                            ],
                        }, 30));
                    return;
                }
            }
            const votePremiumRow = new ActionRowBuilder<ButtonBuilder>()
                .addComponents(
                    new ButtonBuilder()
                        .setLabel('Vote')
                        .setStyle(ButtonStyle.Link)
                        .setURL(ctx.client.config.links.vote)
                        .setEmoji({ id: '1220994256894955531', name: 'w_topgg' })
                )
                .addComponents(
                    new ButtonBuilder()
                        .setLabel('Premium')
                        .setStyle(ButtonStyle.Link)
                        .setURL(ctx.client.config.links.patreon)
                        .setEmoji({ id: "1220994440248819742" })
                );
            if (isVote) {
                const isUserVote = await isUserPremiumOrVote(ctx.member.user.id);
                if (!isUserVote) {
                    const errMsg = `\`⛔\` This command is vote locked. Unlock it by voting for the bot on [top.gg](${ctx.client.config.links.vote}), or by purchasing premium on [Patreon](${ctx.client.config.links.patreon}).`;
                    await (ctx instanceof ChatInputCommandInteraction ||
                        ctx instanceof ContextMenuCommandInteraction
                        ? ctx.reply({
                            embeds: [
                                embed
                                    .setColor(ctx.client.config.colors.red)
                                    .setDescription(errMsg),
                            ],
                            components: [votePremiumRow],
                            ephemeral: true,
                        })
                        : ctx.safeReply({
                            embeds: [
                                embed
                                    .setColor(ctx.client.config.colors.red)
                                    .setDescription(errMsg),
                            ],
                            components: [votePremiumRow],
                        }));
                    return;
                }
            }

            if (isPremium) {
                const isUserPremium = await isPremiumOrGuild(ctx.guild.id, ctx.member.user.id);
                if (!isUserPremium) {
                    const errMsg = `\`⛔\` This command is exclusive to premium servers and users. Gain access to premium features by purchasing premium on [Patreon](${ctx.client.config.links.patreon}).`;
                    const row = new ActionRowBuilder<ButtonBuilder>()
                        .addComponents(
                            new ButtonBuilder()
                                .setLabel('Premium')
                                .setStyle(ButtonStyle.Link)
                                .setURL(ctx.client.config.links.patreon)
                                .setEmoji({ id: "1220994440248819742" })
                        );
                    await (ctx instanceof ChatInputCommandInteraction ||
                        ctx instanceof ContextMenuCommandInteraction
                        ? ctx.reply({
                            embeds: [
                                embed
                                    .setColor(ctx.client.config.colors.red)
                                    .setDescription(errMsg),
                            ],
                            components: [row],
                            ephemeral: true,
                        })
                        : ctx.safeReply({
                            embeds: [
                                embed
                                    .setColor(ctx.client.config.colors.red)
                                    .setDescription(errMsg),
                            ],
                            components: [row],
                        }));
                    return;
                }
            }

            return originalMethod.apply(this, args);
        };

        return descriptor;
    };
}
