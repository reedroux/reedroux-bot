import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from 'discord.js';
import { BotClient, ChatInputCommandInteraction, ApplicationCommandOptionType, Command, Message } from '../../structures/index';
import Utils from '../../utils/Utils';


export default class Help extends Command {
    constructor(client: BotClient) {
        super(client, {
            name: 'help',
            description: {
                content: 'Get help about a command or list all commands',
                usage: 'help [command]',
                examples: ['help', 'help ping'],
            },
            category: 'general',
            aliases: ['helps', 'h'],
            cooldown: 5,
            args: false,
            permissions: {
                dev: false,
                client: ['SendMessages', 'ViewChannel', 'EmbedLinks'],
                user: [],
            },
            slashCommand: true,
            options: [
                {
                    name: 'command',
                    description: 'The command to get help on',
                    type: ApplicationCommandOptionType.String,
                    required: false,
                    autocomplete: true,
                },
            ],
        });
    }

    public async messageRun(message: Message, args: string[]): Promise<any> {
        const cmd = args.join(" ");
        return this.helpCommand(message, cmd);
    }

    public async slashRun(interaction: ChatInputCommandInteraction): Promise<any> {
        const cmd = interaction.options.getString('command');
        return this.helpCommand(interaction, cmd);
    }

    private async helpCommand(ctx: ChatInputCommandInteraction | Message, cmd?: string): Promise<any> {

        let prefix: string;
        if (ctx instanceof Message) {
            prefix = ctx.prefix;
        } else {
            prefix = "/";
        }
        const embed = new EmbedBuilder().setColor(this.client.config.colors.main);
        if (cmd) {
            const command = this.client.getCommand(cmd.toLowerCase());
            if (!command) {
                return ctx instanceof Message ? ctx.safeReply({ embeds: [embed.setDescription('Sorry, that command does not exist.').setColor(this.client.config.colors.red)] }) : ctx.reply({ embeds: [embed.setDescription('Sorry, that command does not exist.').setColor(this.client.config.colors.red)] });
            }
            const commandExamples = [];
            if (Array.isArray(command.description.examples)) {
                for (const i of command.description.examples) {
                    commandExamples.push(`\`${prefix}${i}\``);
                }
            }

            const userPerms = [];
            const botPerms = [];
            const Requirements = [];
            const SubCommands = [];
            const SubSubCommands = [];
            if (Array.isArray(command.permissions.user)) {
                for (const i of command.permissions.user) {
                    userPerms.push(`\`${i}\``);
                }
            }
            if (Array.isArray(command.permissions.client)) {
                for (const i of command.permissions.client) {
                    botPerms.push(`\`${i}\``);
                }
            }
            if (command.options) {
                for (const i of command.options) {
                    if (i.type === 1) {
                        SubCommands.push(i);
                    } else if (i.type === 2) {
                        SubSubCommands.push(i);
                    }
                }
            }
            const fieldData = [
                {
                    name: "Cooldown:",
                    value: `${command.cooldown ? `\`[ ${Utils.formatTime(command.cooldown * 1000)} ]\`` : "`[ 0s ]`"}`,
                    inline: false
                },
                {
                    name: "Category:",
                    value: `${command.category ? command.category : "None"}`,
                    inline: false
                },
                {
                    name: "Aliases:",
                    value: `${command.aliases.length > 0 ? `\`${command.aliases.join("`, `")}\`` : "None"}`,
                    inline: false
                }
            ];

            if (commandExamples.length > 0) {
                fieldData.push({
                    name: "Example(s):",
                    value: `${commandExamples.map((x) => `\`${x}\``).join("\n")}`,
                    inline: false
                });
            }
            if (userPerms.length > 0) {
                fieldData.push({
                    name: "User Permissions:",
                    value: `${userPerms.join(", ")}`,
                    inline: false
                });
            }
            if (botPerms.length > 0) {
                fieldData.push({
                    name: "Bot Permissions:",
                    value: `${botPerms.join(", ")}`,
                    inline: false
                });
            }
            if (Requirements.length > 0) {
                fieldData.push({
                    name: "Requirements:",
                    value: `${Requirements.join("\n")}`,
                    inline: true
                });
            }
            if (SubCommands.length > 0) {
                fieldData.push({
                    name: "Sub Commands:",
                    value: `${SubCommands.map((x) => `\`${x.name}\``).join(", ")}`,
                    inline: true
                });
            }
            if (SubSubCommands.length > 0) {
                fieldData.push({
                    name: "Sub Sub Commands:",
                    value: `${SubSubCommands.map((x) => `\`${x.name}\``).join(", ")}`,
                    inline: true
                });
            }
            embed.setAuthor({ name: `${this.client.user.username} Help - ${command.name}`, iconURL: this.client.user.displayAvatarURL() })
            embed.setDescription(command.description.content);
            embed.addFields(fieldData);
            return ctx instanceof Message ? ctx.safeReply({ embeds: [embed] }) : ctx.reply({ embeds: [embed] });
        }
        const buttonsRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder().setStyle(ButtonStyle.Link).setLabel("Support Server").setURL(this.client.config.links.supportServer).setEmoji({ id: "1220995107252080761" }),
            new ButtonBuilder().setStyle(ButtonStyle.Link).setLabel("Website").setURL(this.client.config.links.website).setEmoji({ id: "1220994720621138002" }),
            new ButtonBuilder().setStyle(ButtonStyle.Link).setLabel("Premium").setURL(this.client.config.links.patreon).setEmoji({ id: "1220994440248819742" }),


        );
        const msg = [
            'Vote for the bot to unlock premium features and earn extra credits! [Vote here](https://reedroux.biz/vote)',
            'Earn credits and unlock premium features by voting for the bot! [Vote here](https://reedroux.biz/vote)',
            'Help support the bot and unlock premium features by voting! [Vote here](https://reedroux.biz/vote)',
            'Voting for the bot can earn you credits and unlock premium features! [Vote here](https://reedroux.biz/vote)',
            'Unlock premium features and earn credits by voting for the bot! [Vote here](https://reedroux.biz/vote)',
            'Want more credits and premium features? Vote for the bot now! [Vote here](https://reedroux.biz/vote)',
            'Show your support for the bot and earn credits to unlock premium features! [Vote here](https://reedroux.biz/vote)',
            'Get rewarded for voting! Earn credits and unlock premium features. [Vote here](https://reedroux.biz/vote)',
            'Don\'t miss out! Voting for the bot can earn you credits and unlock premium features! [Vote here](https://reedroux.biz/vote)',
            'Make your vote count! Earn credits and unlock premium features by voting for the bot! [Vote here](https://reedroux.biz/vote)'
        ];
        const randomMsg = msg[Math.floor(Math.random() * msg.length)];

        embed.setAuthor({ name: `${this.client.user.username} Help Command`, iconURL: this.client.user.displayAvatarURL() })
        embed.setDescription(`Hey there! I'm **${this.client.user.username}**, your friendly Discord music bot. With simplicity and ease of use in mind, I offer a wide range of commands to enhance your music experience!\n\n${randomMsg}`);
        embed.setFooter({ text: `Total Commands: ${this.client.commands.size + 0}`, iconURL: this.client.user.displayAvatarURL() });
        const fields = [];
        for (const category of this.client.commands.filter((x) => x.category !== "owner").map((x) => x.category).filter((x, i, a) => a.indexOf(x) === i)) {
            fields.push({
                name: category.slice(0, 1).toUpperCase() + category.slice(1),
                value: this.client.commands.filter((x) => x.category === category).map((x) => `\`${x.name}\``).join(", "),
                inline: false
            });
        }
        embed.addFields(fields);
        return ctx instanceof Message ? ctx.safeReply({ embeds: [embed], components: [buttonsRow] }) : ctx.reply({ embeds: [embed], components: [buttonsRow] });
    }
}