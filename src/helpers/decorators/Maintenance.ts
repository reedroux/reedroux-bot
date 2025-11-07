import { ChatInputCommandInteraction, EmbedBuilder, Message, User } from 'discord.js';

export function Maintenance() {
    return function (target: Object, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
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

            const errorMsg = '\`⛔\` The bot is currently under maintenance. Please try again later.';
            if (ctx.client.isMaintenance) {
                await (ctx instanceof ChatInputCommandInteraction
                    ? ctx.reply({
                        embeds: [
                            embed.setColor(ctx.client.config.colors.red).setDescription(errorMsg),
                        ],
                        ephemeral: true,
                    })
                    : ctx.safeReply({
                        embeds: [
                            embed.setColor(ctx.client.config.colors.red).setDescription(errorMsg),
                        ],
                    }, 15));
                return;
            } else {
                return originalMethod.apply(this, args);
            }
        };
        return descriptor;
    };
}
