import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    Client,
    ComponentType,
    EmbedBuilder,
    Message,
} from 'discord.js';
import { BotClient } from 'structures/index';

async function optionsMessage(options: { command: any; message: Message }): Promise<any> {
    const { command, message } = options;
    const client = message.client;
    const prefix = message.prefix;
    let msg: Message;
    let pages = (command.options || []).map(x => {
        const required = x.required ? `<${x.name}>` : `[${x.name}]`;
        const optionsText = x.options
            ? x.options.map(d => (d.required ? `<${d.name}>` : `[${d.name}]`)).join(' | ')
            : '';
        return `\`${prefix + command.name} ${required}${optionsText}\`\n> ${x.description}`;
    });

    let page = 1;
    let size = 3;
    let total_pages = Math.ceil(pages.length / size);
    let current_page = 0;
    const copy_pages = pages;

    const commandName = command.name?.toLowerCase();
    const embed = new EmbedBuilder()
        .setColor(client.config.colors.main)
        .setTitle(`Options for ${commandName}`)
        .setDescription(command.description.content || 'No description provided.');

    function updateEmbed(): void {
        const start_index = (page - 1) * size;
        const end_index = start_index + size;

        const fieldName = current_page === 0 ? 'Options' : 'Examples';
        const fieldValue = pages
            .slice(start_index, end_index)
            .join(current_page === 0 ? '\n\n' : '\n');

        embed.spliceFields(0, 1, {
            name: fieldName || 'Options',
            value: fieldValue || 'No options provided.',
            inline: false,
        });

        embed.setFooter({ text: `<Required> | [Optional] Page ${page} of ${total_pages}` });
    }

    const button_ids = {
        next_button: 'next_button',
        stop_button: 'stop_button',
        previous_button: 'previous_button',
        examples_button: 'examples_button',
        options_button: 'options_button',
        home_button: 'home_button',
    };

    const next_button = new ButtonBuilder()
        .setCustomId(button_ids.next_button)
        .setEmoji('➡️')
        .setStyle(total_pages > 1 ? ButtonStyle.Primary : ButtonStyle.Secondary)
        .setDisabled(total_pages > 1 ? false : true);

    const stop_button = new ButtonBuilder()
        .setCustomId(button_ids.stop_button)
        .setLabel('Stop')
        .setStyle(ButtonStyle.Danger)
        .setDisabled(false);

    const previous_button = new ButtonBuilder()
        .setCustomId(button_ids.previous_button)
        .setEmoji('⬅️')
        .setStyle(total_pages > 1 ? ButtonStyle.Primary : ButtonStyle.Secondary)
        .setDisabled(total_pages > 1 ? false : true);

    const examples_button = new ButtonBuilder()
        .setCustomId(button_ids.examples_button)
        .setLabel('Examples')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(false);

    const home_button = new ButtonBuilder()
        .setCustomId(button_ids.home_button)
        .setEmoji('🏠')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(false);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        previous_button,
        stop_button,
        next_button,
        current_page === 0 ? examples_button : null
    );

    pages = copy_pages;
    size = 3;
    total_pages = Math.ceil(pages.length / size);
    page = 1;
    updateEmbed();
    msg = await message.channel?.send({ embeds: [embed], components: [row] });

    const filter = (x: any): boolean =>
        x.user.id === message.author?.id &&
        [
            button_ids.previous_button,
            button_ids.stop_button,
            button_ids.next_button,
            button_ids.examples_button,
            button_ids.home_button,
        ].includes(x.customId);

    const collector = msg?.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 60000,
        filter,
    });

    collector?.once('end', async () => {
        previous_button.setDisabled(true).setStyle(ButtonStyle.Secondary);
        stop_button.setDisabled(true).setStyle(ButtonStyle.Secondary);
        next_button.setDisabled(true).setStyle(ButtonStyle.Secondary);
        examples_button.setDisabled(true).setStyle(ButtonStyle.Secondary);
        home_button.setDisabled(true).setStyle(ButtonStyle.Secondary);

        row.setComponents(
            previous_button,
            stop_button,
            next_button,
            current_page === 0 ? examples_button : home_button
        );

        if (msg)
            await msg.edit({ embeds: [embed], components: [row] }).catch(() => {
                null;
            });
    });

    collector?.on('collect', async interaction => {
        switch (interaction.customId) {
            case button_ids.stop_button:
                collector.stop();
                if (!interaction.deferred) await interaction.deferUpdate().catch(() => {});
                break;
            case button_ids.previous_button:
                page = page - 1 < 1 ? total_pages : --page;
                updateEmbed();
                await interaction.update({ embeds: [embed], components: [row] }).catch(() => {});
                break;

            case button_ids.next_button:
                page = page + 1 > total_pages ? 1 : ++page;
                updateEmbed();
                await interaction.update({ embeds: [embed], components: [row] }).catch(() => {});
                break;

            case button_ids.examples_button:
                pages = (command.description.examples || []).map(x => `\`${prefix}${x}\``);
                size = 5;
                total_pages = Math.ceil(pages.length / size);
                page = 1;
                updateEmbed();

                previous_button
                    .setDisabled(total_pages > 1 ? false : true)
                    .setStyle(total_pages > 1 ? ButtonStyle.Primary : ButtonStyle.Secondary);

                next_button
                    .setDisabled(total_pages > 1 ? false : true)
                    .setStyle(total_pages > 1 ? ButtonStyle.Primary : ButtonStyle.Secondary);

                row.setComponents(previous_button, stop_button, next_button, home_button);

                await interaction.update({ embeds: [embed], components: [row] }).catch(() => {});
                current_page = 1;
                break;

            case button_ids.home_button:
                pages = copy_pages;
                size = 3;
                total_pages = Math.ceil(pages.length / size);
                page = 1;
                updateEmbed();

                previous_button
                    .setDisabled(total_pages > 1 ? false : true)
                    .setStyle(total_pages > 1 ? ButtonStyle.Primary : ButtonStyle.Secondary);

                next_button
                    .setDisabled(total_pages > 1 ? false : true)
                    .setStyle(total_pages > 1 ? ButtonStyle.Primary : ButtonStyle.Secondary);

                row.setComponents(previous_button, stop_button, next_button, examples_button);

                await interaction.update({ embeds: [embed], components: [row] }).catch(() => {});
                current_page = 0;
                break;
        }
    });
}

export { optionsMessage };
