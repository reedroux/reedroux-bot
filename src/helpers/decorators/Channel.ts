import { ChannelType, EmbedBuilder, GuildMember, User, ChatInputCommandInteraction, Message } from 'discord.js';



export function ChannelCheck() {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        const originalMethod = descriptor.value;
        descriptor.value = async function (...args: any[]) {
            const ctx: ChatInputCommandInteraction | Message = args[0];
            const embed = new EmbedBuilder().setAuthor({
                name:
                    ctx.member.user instanceof User
                        ? ctx.member.user.globalName || ctx.member.user.username
                        : null,
                iconURL: ctx.member.user instanceof User ? ctx.member.user.avatarURL() : null,
            }).setColor(ctx.client.config.colors.red);
            // check for text channel
            if (ctx.channel.type === ChannelType.GuildText || ctx.channel.type === ChannelType.GuildVoice) {
                const botChannels = await ctx.client.db.getBotChannels(ctx.guild.id);
                if (botChannels && botChannels.length > 0) {
                    const botChannelIds = botChannels.map((channel: any) => channel.channelId);
                    if (typeof ctx.member.permissions !== 'string' &&
                        !ctx.member.permissions.has('ManageGuild') && !botChannelIds.includes(ctx.channel.id)) {
                        // Delete the message if it's not in a bot channel
                        if (ctx instanceof Message) {
                            await ctx.delete().catch(() => { });
                        }
                        const errorMessage = `\`⛔\` You can only use commands in designated bot channels. Check <#${botChannelIds.join(">, <#")}> for allowed channels.`;
                        if (ctx instanceof Message) {
                            ctx.safeReply({ embeds: [embed.setDescription(errorMessage)] }, 15);
                        } else {
                            ctx.reply({ embeds: [embed.setDescription(errorMessage)], ephemeral: true });
                        }
                        return;
                    }
                }
            }
            // check for voice channel 
            if (ctx.member instanceof GuildMember && ctx.member.voice && ctx.member.voice.channel) {
                if (ctx.member.voice.channel.type === ChannelType.GuildVoice || ctx.member.voice.channel.type === ChannelType.GuildStageVoice) {
                    const voiceChannels = await ctx.client.db.getVoiceChannels(ctx.guild.id);
                    if (voiceChannels && voiceChannels.length > 0) {
                        const voiceChannelIds = voiceChannels.map((channel: any) => channel.channelId);
                        if (typeof ctx.member.permissions !== 'string' &&
                            !ctx.member.permissions.has('ManageGuild') && !voiceChannelIds.includes(ctx.member.voice.channel.id)) {
                            const errorMessage = `\`⛔\` You don't have permission to use the bot in this voice channel. Please use it in one of the allowed channels: <#${voiceChannelIds.join(">, <#")}>.`;
                            if (ctx instanceof Message) {
                                ctx.safeReply({ embeds: [embed.setDescription(errorMessage)] }, 15);
                            } else {
                                ctx.reply({ embeds: [embed.setDescription(errorMessage)], ephemeral: true });
                            }
                            return;
                        }
                    }
                }
            }
            return originalMethod.apply(this, args);
        };
        return descriptor;
    }
}