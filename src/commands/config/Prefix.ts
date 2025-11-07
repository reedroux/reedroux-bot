import {
    ActionRowBuilder,
    ButtonBuilder,
    ComponentType,
    EmbedBuilder,
    InteractionType,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
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


export default class PrefixCommand extends Command {
    constructor(client: BotClient) {
        super(client, {
            name: 'prefix',
            description: {
                content: 'Configure the prefix for the bot',
                usage: 'prefix <set|reset> [new prefix]',
                examples: ['prefix set', 'prefix reset'],
            },
            aliases: ['setprefix'],
            category: 'config',
            cooldown: 5,
            args: false,
            permissions: {
                dev: false,
                client: ['SendMessages', 'ViewChannel', 'EmbedLinks'],
                user: ['ManageGuild'],
            },
            slashCommand: true,
            options: [
                {
                    name: 'set',
                    description: 'The new prefix you want to set',
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: 'prefix',
                            description: 'The new prefix you want to set',
                            type: ApplicationCommandOptionType.String,
                            required: true,
                            max_length: 5,
                            min_length: 1,
                        },
                    ],
                },
                {
                    name: 'reset',
                    description: 'Reset the prefix to the default',
                    type: ApplicationCommandOptionType.Subcommand,
                },
            ],
        });
    }
    @MusicCheck({
        inVoice: false,
        sameVoice: false,
        isVote: true,
    })
    public async messageRun(message: Message, args: string[]): Promise<any> {
        const subcommand = args.shift()?.toLowerCase();
        const embed = new EmbedBuilder()
            .setColor(this.client.config.colors.main)
            .setAuthor({ name: 'Configure the prefix', iconURL: message.guild.iconURL() })
        if (!subcommand) {
            return await this.setPrefixModal(message);
        }
        if (subcommand === 'set') {
            const prefix = args.join(' ');
            if (prefix.length > 5)
                return await message.safeReply({
                    //content: '\`❌\` The prefix must be less than 5 characters',
                    embeds: [embed.setDescription('\`❌\` The prefix must be less than 5 characters').setColor(this.client.config.colors.red)],
                });
            await this.client.db.updateGuild({
                guildId: message.guild.id,
                prefix,
            });
            return await message.safeReply({
                embeds: [embed.setDescription(`\`✅\` Successfully changed the prefix to \`${prefix}\``)],
            });
        } else if (subcommand === 'reset') {
            await this.client.db.updateGuild({
                prefix: this.client.config.prefix,
                guildId: message.guild.id,
            });
            return await message.safeReply({
                embeds: [embed.setDescription(`\`✅\` Successfully reset the prefix to \`${this.client.config.prefix}\``)],
            });
        }
    }
    @MusicCheck({
        inVoice: false,
        sameVoice: false,
        isVote: true,
    })
    public async slashRun(interaction: ChatInputCommandInteraction): Promise<any> {
        const subcommand = interaction.options.getSubcommand(true);
        const embed = new EmbedBuilder()
            .setColor(this.client.config.colors.main)
            .setAuthor({ name: 'Configure the prefix', iconURL: interaction.guild.iconURL() })

        if (subcommand === 'set') {
            const prefix = interaction.options.getString('prefix', true);
            if (prefix.length > 5)
                return await interaction.reply({
                    embeds: [embed.setDescription('\`❌\` The prefix must be less than 5 characters').setColor(this.client.config.colors.red)],
                });
            await this.client.db.updateGuild({
                guildId: interaction.guild.id,
                prefix,
            });
            return await interaction.reply({
                embeds: [embed.setDescription(`\`✅\` Successfully changed the prefix to \`${prefix}\``)],
            });
        } else if (subcommand === 'reset') {
            await this.client.db.updateGuild({
                prefix: this.client.config.prefix,
                guildId: interaction.guild.id,
            });
            return await interaction.reply({
                embeds: [embed.setDescription(`\`✅\` Successfully reset the prefix to \`${this.client.config.prefix}\``)],
            });
        }
    }

    private async setPrefixModal(message: Message) {
        const prefix =
            (await this.client.db.getPrefix(message.guild.id)) || this.client.config.prefix;
        const modal = new ModalBuilder().setCustomId('prefix_modal').setTitle('Prefix');

        const Input = new TextInputBuilder()
            .setCustomId('prefix_input')
            .setPlaceholder('Type your prefix')
            .setLabel('Prefix')
            .setValue(prefix)
            .setMinLength(1)
            .setMaxLength(5)
            .setStyle(TextInputStyle.Short);

        const modalComponent = new ActionRowBuilder<TextInputBuilder>().addComponents(Input);
        modal.addComponents(modalComponent);

        const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder().setCustomId('prefix_modal').setLabel('Change Prefix').setStyle(1)
        );

        const msg = await message.channel.send({
            embeds: [
                {
                    author: {
                        name: `Current Prefix is ${prefix}`,
                        icon_url: message.guild.iconURL({ extension: 'png' }),
                    },
                    color: this.client.config.colors.main,
                    description: `- Are you sure you want to change the beginning? Click the button below to proceed.`,
                },
            ],
            components: [buttonRow],
        });
        const filter = (interaction: any) =>
            interaction.customId === 'prefix_modal' && interaction.user.id === message.author.id;
        const collector = msg?.createMessageComponentCollector({
            filter,
            time: 30000,
            componentType: ComponentType.Button,
        });
        collector.on('collect', async interaction => {
            if (interaction.customId === 'prefix_modal') {
                await interaction.showModal(modal);
            }
            await interaction
                .awaitModalSubmit({ time: 60000, filter })
                .then(async (interaction: any) => {
                    const prefix = interaction.fields.getTextInputValue('prefix_input');
                    await this.client.db.updateGuild({
                        prefix,
                        guildId: message.guild.id,
                    });
                    await interaction
                        .update({
                            embeds: [
                                {
                                    color: this.client.config.colors.main,
                                    description: `\`✅\` Successfully changed the prefix to \`${prefix}\``,
                                },
                            ],
                            components: [],
                        })
                        .catch(() => null);
                })
                .catch(() => null);
        });
        collector.on('end', async () => {
            if (msg && msg.editable) {
                await BotUtils.handleCollectorEnd(msg).catch(() => { });
            }
        });
    }
}
