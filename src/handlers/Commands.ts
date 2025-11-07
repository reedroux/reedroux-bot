import { ChatInputCommandInteraction, Collection, DiscordAPIError, Message } from 'discord.js';
import Utils from '../utils/Utils';
import { optionsMessage } from '../helpers/Options';
import { ChannelCheck, Maintenance } from '../helpers/decorators/index';
import { checkDisabledCommands } from '../helpers/Checkes';
import { WebHook } from '../helpers/WebHook';


export default class handleCommands {
    @Maintenance()
    @ChannelCheck()
    public async handlePrefixCommand(
        message: Message,
        command: any,
        args: string[]
    ): Promise<any> {
        if (
            'permissionsFor' in message.channel &&
            !message.channel.permissionsFor(message.guild.members.me)?.has('SendMessages')
        )
            return;
        await message.client.db.createUser(message.author.id);
        await message.client.db.createGuild(message.guild.id);
        const canUse = await checkDisabledCommands(message.client, message, command.name);
        if (canUse) {
            return message.safeReply({
                content: '\`❌\` This command is disabled in this server.',
            }, 15);
        }
        // command args
        if (command.args && !args.length) {
            return await optionsMessage({
                message,
                command: command,
            });
        }
        // command cooldown
        if (command.cooldown) {
            if (!message.client.cooldowns.has(command.name)) {
                message.client.cooldowns.set(command.name, new Collection());
            }
            const now = Date.now();
            const timestamps = message.client.cooldowns.get(command.name);
            const cooldownAmount = (command.cooldown || 3) * 1000;

            if (timestamps.has(message.author.id) && !message.client.config.owners.includes(message.author.id)) {
                const expirationTime = timestamps.get(message.author.id) + cooldownAmount;
                if (now < expirationTime) {
                    if (!timestamps.has(`${message.author.id}-cooldown-message`)) {
                        const timeLeft = (expirationTime - now) / 1000;
                        timestamps.set(`${message.author.id}-cooldown-message`, true);
                        return await message.safeReply({
                            embeds: [{
                                color: 0xff0000,
                                author: {
                                    name: `| You are on a cooldown for ${timeLeft.toFixed(1)}s!`,
                                    icon_url: message.author.avatarURL(),
                                },
                                description: `Please wait ${timeLeft.toFixed(1)}s before reusing the \`${command.name}\` command.`,
                            }],
                        }).catch(() => { });
                    } else { return; }
                } else {
                    timestamps.delete(`${message.author.id}-cooldown-message`);
                }
            }
            timestamps.set(message.author.id, now);
            setTimeout(() => {
                timestamps.delete(message.author.id);
                timestamps.delete(`${message.author.id}-cooldown-message`);
            }, cooldownAmount);
        }
        // command permissions
        if (command.permissions) {
            const client_permissions = command.permissions.client;
            const user_permissions = command.permissions.user;
            const missing_client_permissions = client_permissions.filter((x: any) => {
                return (
                    !message.guild.members.me.permissions.has(x) ||
                    ('permissionsFor' in message.channel &&
                        !message.channel.permissionsFor(message.guild.members.me).has(x))
                );
            });

            if (missing_client_permissions.length > 0) {
                const missing_channel_permissions = missing_client_permissions.filter(
                    (permission: any) => {
                        return (
                            'permissionsFor' in message.channel &&
                            !message.channel
                                .permissionsFor(message.guild.members.me)
                                .has(permission)
                        );
                    }
                );
                let content = `\`❌\` I need ${Utils.parsePermissions(missing_client_permissions)} to execute this command.`;
                if (missing_channel_permissions.length > 0) {
                    content += `Additionally, I need ${Utils.parsePermissions(missing_channel_permissions)} in this channel.`;
                }
                return await message.safeReply({ content });
            }
            const missing_user_permissions = user_permissions.filter(
                (x: any) => !message.member.permissions.has(x)
            );
            if (missing_user_permissions.length > 0) {
                return await message.safeReply({
                    content: `\`❌\` You need ${Utils.parsePermissions(missing_user_permissions)} to execute this command.`,
                });
            }
            if (command.permissions.dev) {
                if (message.client.config.owners) {
                    const findDev = message.client.config.owners.find(x => x === message.author.id);
                    if (!findDev)
                        return await message.safeReply({
                            content: '\`❌\` You are not a developer of this bot.',
                        });
                }
            }
        }
        try {
            await command.messageRun(message, args);
        } catch (error) {
            console.error(error);
            /*  return await message.safeReply({
                 content: 'An error occurred while executing this command.',
             }); */
            new WebHook(message.client.config.hooks.errors, 'Command Error').error(error);
        } finally {
            await message.client.db.updateCommandUsage(command.name);
        }
    }
    @ChannelCheck()
    public async handleSlashCommand(interaction: ChatInputCommandInteraction): Promise<any> {
        const cmd = interaction.client.slashCommand.get(interaction.commandName);

        if (!cmd) return;
        await interaction.client.db.createUser(interaction.user.id);
        await interaction.client.db.createGuild(interaction.guild.id);
        const canUse = await checkDisabledCommands(interaction.client, interaction, cmd.name);
        if (canUse) {
            return interaction.reply({
                content: 'This command is disabled in this server.',
                ephemeral: true,
            });
        }

        // command cooldown
        if (cmd.cooldown) {
            if (!interaction.client.cooldowns.has(cmd.name)) {
                interaction.client.cooldowns.set(cmd.name, new Collection());
            }
            const now = Date.now();
            const timestamps = interaction.client.cooldowns.get(cmd.name);
            const cooldownAmount = (cmd.cooldown || 3) * 1000;

            if (timestamps.has(interaction.user.id)) {
                const expirationTime = timestamps.get(interaction.user.id) + cooldownAmount;
                if (now < expirationTime) {
                    if (!timestamps.has(`${interaction.user.id}-cooldown-message`)) {
                        const timeLeft = (expirationTime - now) / 1000;
                        timestamps.set(`${interaction.user.id}-cooldown-message`, true);
                        return await interaction.reply({
                            embeds: [{
                                color: 0xff0000,
                                author: {
                                    name: `| You are on a cooldown for ${timeLeft.toFixed(1)}s!`,
                                    icon_url: interaction.user.avatarURL(),
                                },
                                description: `Please wait ${timeLeft.toFixed(1)}s before reusing the \`${cmd.name}\` command.`,
                            }],
                        }).catch(() => { });
                    } else { return; }
                } else {
                    timestamps.delete(`${interaction.user.id}-cooldown-message`);
                }
            }
            timestamps.set(interaction.user.id, now);
            setTimeout(() => {
                timestamps.delete(interaction.user.id);
                timestamps.delete(`${interaction.user.id}-cooldown-message`);
            }, cooldownAmount);
        }

        // command permissions
        if (cmd.permissions) {
            const client_permissions = cmd.permissions.client;
            const user_permissions = cmd.permissions.user;
            const missing_client_permissions = client_permissions.filter(
                (x: any) => !interaction.guild.members.me.permissions.has(x)
            );

            if (missing_client_permissions.length > 0) {
                return interaction.reply({
                    content: `\`❌\` I need ${Utils.parsePermissions(missing_client_permissions)} to execute this command.`,
                    ephemeral: true,
                });
            }
            const missing_user_permissions = user_permissions.filter(
                (x: any) =>
                    typeof interaction.member.permissions !== 'string' &&
                    !interaction.member.permissions.has(x)
            );

            if (missing_user_permissions.length > 0) {
                return interaction.reply({
                    content: `\`❌\` You need ${Utils.parsePermissions(missing_user_permissions)} to execute this command.`,
                    ephemeral: true,
                });
            }
            if (cmd.permissions.dev) {
                if (interaction.client.config.owners) {
                    const findDev = interaction.client.config.owners.find(
                        x => x === interaction.user.id
                    );
                    if (!findDev) return;
                }
            }
        }

        try {
            await cmd.slashRun(interaction).catch(() => null);
        } catch (error) {
            if (error instanceof DiscordAPIError && error.code === 10062) {
                // Handle "Unknown interaction" error
                return interaction.reply({
                    content: '\`❌\` This interaction is no longer valid. Please initiate the command again.',
                    ephemeral: true
                });
            } else {
                console.error(error);
                new WebHook(interaction.client.config.hooks.errors, 'interaction Error').error(error);
                if (!interaction.replied) {
                    return interaction.reply({
                        content: `\`❌\` Please try again later. or contact the developer.${interaction.client.config.links.supportServer}`,
                    });
                } else {
                    return interaction.editReply({
                        content: `\`❌\` Please try again later. or contact the developer.${interaction.client.config.links.supportServer}`,
                    });
                }
            }
        } finally {

            await interaction.client.db.updateCommandUsage(cmd.name);
        }
    }
}
