import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ComponentType,
    EmbedBuilder,
    InteractionResponse,
    RoleSelectMenuBuilder,
} from 'discord.js';
import {
    ApplicationCommandOptionType,
    BotClient,
    ChatInputCommandInteraction,
    Command,
    Message,
} from '../../structures/index';
import { MusicCheck } from '../../helpers/decorators/Music';
import BotUtils from '../../utils/BotUtils';



export default class DjCommand extends Command {
    private data: Array<{ roleId: string }> = [];
    private isSaving: boolean = false;
    private response: InteractionResponse | Message;
    constructor(client: BotClient) {
        super(client, {
            name: 'dj',
            description: {
                content: 'Add a role to the DJ list',
                usage: 'dj add <role> | remove | list | clear | toggle',
                examples: [
                    'dj add @DJ',
                    'dj remove DJ',
                    'dj list',
                    'dj clear',
                    'dj toggle',
                    'dj info',
                ],
            },
            category: 'config',
            aliases: ['djrole', 'setdj'],
            cooldown: 5,
            permissions: {
                dev: false,
                client: ['SendMessages', 'ViewChannel', 'EmbedLinks'],
                user: ['ManageGuild'],
            },
            args: false,
            slashCommand: true,
            options: [
                {
                    name: 'add',
                    description: 'To add a role to the DJ list',
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: 'role',
                            description: 'The role to add',
                            type: ApplicationCommandOptionType.Role,
                            required: true,
                        },
                    ],
                },
                {
                    name: 'remove',
                    description: 'To remove a role from the DJ list',
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: 'role',
                            description: 'The role to remove',
                            type: ApplicationCommandOptionType.Role,
                            required: true,
                        },
                    ],
                },
                {
                    name: 'list',
                    description: 'To list all roles in the DJ list',
                    type: ApplicationCommandOptionType.Subcommand,
                },
                {
                    name: 'clear',
                    description: 'To clear all roles in the DJ list',
                    type: ApplicationCommandOptionType.Subcommand,
                },
                {
                    name: 'toggle',
                    description: 'To toggle the DJ mode',
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: 'mode',
                            description: 'Enable or disable the DJ mode',
                            type: ApplicationCommandOptionType.Boolean,
                            required: true,
                        },
                    ],
                },
                {
                    name: 'info',
                    description: 'To get info about the DJ mode',
                    type: ApplicationCommandOptionType.Subcommand,
                },
            ],
        });
    }
    @MusicCheck({
        inVoice: false,
        sameVoice: false,
        isPremium: true,
    })
    public async messageRun(message: Message, args: string[]): Promise<any> {
        let djData = await this.client.db.getDj(message.guild.id);
        const backbut = new ButtonBuilder()
            .setCustomId('dj_back')
            .setLabel('Back')
            .setStyle(ButtonStyle.Secondary);

        const embed = new EmbedBuilder()
            .setAuthor({ name: message.guild.name, iconURL: message.guild.iconURL() })
            .setDescription('Configure the DJ role')
            .setColor(this.client.config.colors.main)
            .setFooter({
                text: 'DJ role can control the music and also dj can use disable commands',
            });

        this.response = await message.channel.send({
            embeds: [embed],
            components: this.ButtonsRow,
        });

        const djRoles = await this.client.db.getDjRole(message.guild.id);

        const roleMenu = new RoleSelectMenuBuilder()
            .setCustomId('select_dj_role')
            .setPlaceholder('Select a role')
            .setMinValues(1)
            .setMaxValues(5)
            .addDefaultRoles(djRoles ? djRoles.map(x => x.roleId) : []);

        const toggleRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
                .setCustomId('dj_toggle_on')
                .setLabel('Enable')
                .setDisabled(djData ? djData.mode : false)
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId('dj_toggle_off')
                .setLabel('Disable')
                .setDisabled(djData ? !djData.mode : true)
                .setStyle(ButtonStyle.Danger)
        );

        const confirmRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
                .setCustomId('dj_confirm')
                .setLabel('Confirm')
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId('dj_cancel')
                .setLabel('Cancel')
                .setStyle(ButtonStyle.Danger)
        );
        const filter = (i: any) => i.user.id === message.author.id;
        const buttonCollector = message.channel.createMessageComponentCollector({
            filter,
            time: 30000,
            message: this.response,
        });

        buttonCollector.on('collect', async i => {
            switch (i.customId) {
                case 'dj_add': {
                    if (djRoles.length >= 5) {
                        embed.setDescription('\`❌\` You can only add 5 roles to the DJ list');
                        await this.client.update(i, {
                            embeds: [embed],
                            components: [
                                new ActionRowBuilder<ButtonBuilder>().addComponents(backbut),
                            ],
                        });
                        return;
                    }
                    embed.setDescription('- Select the role to add to the DJ list');
                    const row = new ActionRowBuilder<RoleSelectMenuBuilder>().addComponents(
                        roleMenu
                    );
                    const backRow = new ActionRowBuilder<ButtonBuilder>().addComponents(backbut);
                    await this.client.update(i, { embeds: [embed], components: [row, backRow] });
                    this.isSaving = true;
                    break;
                }
                case 'dj_remove': {
                    embed.setDescription('- Select the role to remove from the DJ list');
                    const row = new ActionRowBuilder<RoleSelectMenuBuilder>().addComponents(
                        roleMenu
                    );
                    const backRow = new ActionRowBuilder<ButtonBuilder>().addComponents(backbut);
                    await this.client.update(i, { embeds: [embed], components: [row, backRow] });
                    this.isSaving = false;
                    break;
                }
                case 'dj_list': {
                    if (!djRoles.length) {
                        embed.setDescription('\`❌\` There are no DJ roles');
                        await this.client.update(i, {
                            embeds: [embed],
                            components: [
                                new ActionRowBuilder<ButtonBuilder>().addComponents(backbut),
                            ],
                        });
                        return;
                    }
                    embed.setDescription(`Dj Roles \`(${djRoles.length})\``);
                    for (let i = 0; i < djRoles.length; i++) {
                        embed.addFields({
                            name: `# ${i + 1}`,
                            value: `>>> **Role:** <@&${djRoles[i].roleId}>\n**Moderator:** <@${djRoles[i].moderatorId}>\n**Updated At:** <t:${Math.round(
                                Number(djRoles[i].updatedAt) / 1000
                            )}:R>`,
                            inline: false,
                        });
                    }
                    await this.client.update(i, {
                        embeds: [embed],
                        components: [new ActionRowBuilder<ButtonBuilder>().addComponents(backbut)],
                    });
                    embed.spliceFields(0, djRoles.length);
                    break;
                }
                case 'dj_clear': {
                    if (!djRoles.length) {
                        embed.setDescription('\`❌\` There are no DJ roles');
                        await this.client.update(i, {
                            embeds: [embed],
                            components: [
                                new ActionRowBuilder<ButtonBuilder>().addComponents(backbut),
                            ],
                        });
                        return;
                    }
                    embed.setDescription('\`⚠️\` Are you sure you want to clear all DJ roles?');
                    await this.client.update(i, {
                        embeds: [embed],
                        components: [
                            confirmRow,
                            new ActionRowBuilder<ButtonBuilder>().addComponents(backbut),
                        ],
                    });
                    break;
                }
                case 'dj_toggle': {
                    const djData = await this.client.db.getDj(message.guild.id);
                    embed.setDescription(
                        `- DJ mode is currently ${djData.mode ? 'enabled' : 'disabled'}`
                    );
                    await this.client.update(i, {
                        embeds: [embed],
                        components: [
                            toggleRow,
                            new ActionRowBuilder<ButtonBuilder>().addComponents(backbut),
                        ],
                    });
                    break;
                }
                case 'dj_info': {
                    const djRoles = await this.client.db.getDjRole(message.guild.id);
                    if (!djRoles.length) {
                        embed.setDescription('\`❌\` There are no DJ roles');
                        await this.client.update(i, {
                            embeds: [embed],
                            components: [
                                new ActionRowBuilder<ButtonBuilder>().addComponents(backbut),
                            ],
                        });
                        return;
                    }
                    // list of dj role have members id
                    const djMembers = () => {
                        let members = [];
                        djRoles.forEach(role => {
                            const roleMembers = message.guild.roles.cache
                                .get(role.roleId)
                                .members.map(x => x.id);
                            members.push(...roleMembers);
                        });
                        return members;
                    };
                    embed.setDescription(
                        `- DJ mode is currently ${djData.mode ? 'enabled' : 'disabled'}`
                    );
                    embed.addFields([
                        {
                            name: 'Roles',
                            value: `>>> ${djRoles.length ? djRoles.map((x: any) => `<@&${x.roleId}>`).join(', ') : 'None'}`,
                        },
                        {
                            name: 'DJ Members',
                            value: `>>> ${djMembers().length
                                ? djMembers()
                                    .map((x: any) => `<@${x}>`)
                                    .join(', ')
                                : 'None'
                                }`,
                            inline: true,
                        },
                    ]);
                    embed.setFooter({
                        text: `Total DJ Members: ${djMembers().length} is online users`,
                    });
                    await this.client.update(i, {
                        embeds: [embed],
                        components: [new ActionRowBuilder<ButtonBuilder>().addComponents(backbut)],
                    });
                    // remove fields
                    embed.spliceFields(0, 2);
                    break;
                }
                case 'dj_back': {
                    embed.setDescription('Configure the DJ role');
                    await this.client.update(i, { embeds: [embed], components: this.ButtonsRow });
                    break;
                }
                case 'dj_toggle_on': {
                    embed.setDescription(`\`✅\` Successfully changed the DJ mode to \`enabled\``);
                    await this.client.db.updateDj({ mode: true, guildId: message.guild.id });
                    await this.client.update(i, { embeds: [embed], components: this.ButtonsRow });
                    break;
                }
                case 'dj_toggle_off': {
                    embed.setDescription(`\`✅\` Successfully changed the DJ mode to \`disabled\``);
                    await this.client.db.updateDj({ mode: false, guildId: message.guild.id });
                    await this.client.update(i, { embeds: [embed], components: this.ButtonsRow });
                    break;
                }
                // save the data
                case 'dj_save': {
                    if (this.data.length) {
                        await this.client.db.updateDj({
                            mode: djData ? djData.mode : true,
                            guildId: message.guild.id,
                        });
                        await this.client.db.updateDjRole(
                            message.guild.id,
                            this.data,
                            message.author.id
                        );
                        if (this.isSaving) {
                            embed.setDescription(
                                `\`✅\` Successfully added ${this.data.map(x => `<@&${x.roleId}>`).join(', ')} to the DJ list`
                            );
                        } else {
                            const removedRoles = djRoles.filter(
                                x => !this.data.find(y => y.roleId === x.roleId)
                            );
                            embed.setDescription(
                                `\`✅\` Successfully removed ${removedRoles.map(x => `<@&${x.roleId}>`).join(', ')} from the DJ list`
                            );
                        }
                        this.data = [];
                    }
                    await this.client.update(i, { embeds: [embed], components: [] });
                }
                case 'dj_cancel': {
                    this.data = [];
                    await this.client.update(i, { embeds: [embed], components: this.ButtonsRow });
                    break;
                }
                case 'dj_confirm': {
                    await this.client.db.clearDjRoles(message.guild.id);
                    embed.setDescription('\`✅\` Successfully cleared all DJ roles');
                    await this.client.update(i, { embeds: [embed], components: [] });
                    break;
                }
            }
            djData = await this.client.db.getDj(message.guild.id);
            this.response = i.message;
        });
        buttonCollector.on('end', async () => {
            if (this.response instanceof Message && this.response.editable) {
                if (!this.response || !this.response.editable) return;
                await BotUtils.handleCollectorEnd(this.response).catch(() => { });
            }
        });
        const channelCollector = message.channel.createMessageComponentCollector({
            filter,
            time: 30000,
            message: this.response,
            componentType: ComponentType.RoleSelect,
        });
        channelCollector.on('collect', async interaction => {
            switch (interaction.customId) {
                case 'select_dj_role': {
                    // save the data maybe interaction.values will be an array
                    interaction.values.forEach(role => {
                        // store the data
                        this.data.push({ roleId: role });
                    });
                }
            }
            await interaction.update({ embeds: [embed], components: this.ButtonsRow });
            this.response = interaction.message;
        });
    }
    @MusicCheck({
        inVoice: false,
        sameVoice: false,
        isPremium: true,
    })
    public async slashRun(interaction: ChatInputCommandInteraction): Promise<any> {
        const subCommand = interaction.options.getSubcommand();
        const role = interaction.options.getRole('role');
        let djData = await this.client.db.getDj(interaction.guild.id);
        let djRoles = await this.client.db.getDjRole(interaction.guild.id);
        const embed = new EmbedBuilder()
            .setAuthor({ name: interaction.guild.name, iconURL: interaction.guild.iconURL() })
            .setDescription('Configure the DJ role')
            .setColor(this.client.config.colors.main)
            .setFooter({
                text: 'DJ role can control the music and also dj can use disable commands',
            });
        switch (subCommand) {
            case 'add': {
                if (djRoles.length >= 5) {
                    embed.setDescription('\`❌\` You can only add 5 roles to the DJ list');
                    return await interaction.reply({ embeds: [embed] });
                }
                if (djRoles.find(x => x.roleId === role.id)) {
                    embed.setDescription('\`❌\` This role is already in the DJ list');
                    return await interaction.reply({ embeds: [embed] });
                }
                await this.client.db.updateDjRole(
                    interaction.guild.id,
                    [{ roleId: role.id }],
                    interaction.user.id
                );
                embed.setDescription(`\`✅\` Successfully added <@&${role.id}> to the DJ list`);
                return await interaction.reply({ embeds: [embed] });
            }
            case 'remove': {
                if (!djRoles.find(x => x.roleId === role.id)) {
                    embed.setDescription('\`❌\` This role is not in the DJ list');
                    return await interaction.reply({ embeds: [embed] });
                }
                await this.client.db.deleteDjRole(interaction.guild.id, role.id);
                embed.setDescription(`\`✅\` Successfully removed <@&${role.id}> from the DJ list`);
                return await interaction.reply({ embeds: [embed] });
            }
            case 'list': {
                if (!djRoles.length) {
                    embed.setDescription('\`❌\` There are no DJ roles');
                    return await interaction.reply({ embeds: [embed] });
                }
                embed.setDescription(`Dj Roles \`(${djRoles.length})\``);
                for (let i = 0; i < djRoles.length; i++) {
                    embed.addFields({
                        name: `# ${i + 1}`,
                        value: `>>> **Role:** <@&${djRoles[i].roleId}>\n**Moderator:** <@${djRoles[i].moderatorId}>\n**Updated At:** <t:${Math.round(
                            Number(djRoles[i].updatedAt) / 1000
                        )}:R>`,
                        inline: false,
                    });
                }
                return await interaction.reply({ embeds: [embed] });
            }
            case 'clear': {
                if (!djRoles.length) {
                    embed.setDescription('\`❌\` There are no DJ roles');
                    return await interaction.reply({ embeds: [embed] });
                }
                await this.client.db.clearDjRoles(interaction.guild.id);
                embed.setDescription('\`✅\` Successfully cleared all DJ roles');
                return await interaction.reply({ embeds: [embed] });
            }
            case 'toggle': {
                const mode = interaction.options.getBoolean('mode');
                if (djData && djData.mode === mode) {
                    embed.setDescription(`- DJ mode is already ${mode ? 'enabled' : 'disabled'}`);
                    return await interaction.reply({ embeds: [embed] });
                } else {
                    await this.client.db.updateDj({ mode, guildId: interaction.guild.id });
                    embed.setDescription(
                        `\`✅\` Successfully changed the DJ mode to \`${mode ? 'enabled' : 'disabled'}\``
                    );
                    return await interaction.reply({ embeds: [embed] });
                }
            }
            case 'info': {
                if (!djRoles.length) {
                    embed.setDescription('\`❌\` There are no DJ roles');
                    return await interaction.reply({ embeds: [embed] });
                }
                // list of dj role have members id
                const djMembers = () => {
                    let members = [];
                    djRoles.forEach(role => {
                        const roleMembers = interaction.guild.roles.cache
                            .get(role.roleId)
                            .members.map(x => x.id);
                        members.push(...roleMembers);
                    });
                    return members;
                };
                embed.setDescription(
                    `- DJ mode is currently ${djData.mode ? 'enabled' : 'disabled'}`
                );
                embed.addFields([
                    {
                        name: 'Roles',
                        value: `>>> ${djRoles.length ? djRoles.map((x: any) => `<@&${x.roleId}>`).join(', ') : 'None'}`,
                    },
                    {
                        name: 'DJ Members',
                        value: `>>> ${djMembers().length
                            ? djMembers()
                                .map((x: any) => `<@${x}>`)
                                .join(', ')
                            : 'None'
                            }`,
                        inline: true,
                    },
                ]);
                embed.setFooter({
                    text: `Total DJ Members: ${djMembers().length} is online users`,
                });
                return await interaction.reply({ embeds: [embed] });
            }
        }
    }

    private get ButtonsRow(): ActionRowBuilder<ButtonBuilder>[] {
        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
                .setCustomId('dj_add')
                .setLabel('Add Role')
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('dj_remove')
                .setLabel('Remove Role')
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('dj_list')
                .setLabel('List Roles')
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('dj_clear')
                .setLabel('Clear Roles')
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('dj_toggle')
                .setLabel('Toggle Mode')
                .setStyle(ButtonStyle.Secondary)
        );
        const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
                .setCustomId('dj_info')
                .setLabel('Info')
                .setStyle(ButtonStyle.Secondary)
        );

        if (Object.keys(this.data).length) {
            row2.addComponents(
                new ButtonBuilder()
                    .setCustomId('dj_save')
                    .setLabel('Save')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('dj_cancel')
                    .setLabel('Cancel')
                    .setStyle(ButtonStyle.Danger)
            );
        }
        return [row, row2];
    }
}
