import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction, Message } from "discord.js";
import BotUtils from '../utils/BotUtils';

export async function paginate(ctx: ChatInputCommandInteraction | Message, embed: any[]): Promise<Message | void> {
    if (embed.length < 2) {
        ctx instanceof Message ? ctx.safeReply({ embeds: embed }) : ctx.reply({ embeds: embed });
        return;
    }
    let page = 0;
    const getButton = (page: number): any => {
        const fastEmbed = page === 0;
        const lastEmbed = page === embed.length - 1;
        const pageEmbed = embed[page];
        const row = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('paginate_first')
                    .setLabel('First')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(fastEmbed),

                new ButtonBuilder()
                    .setCustomId('paginate_back')
                    .setLabel('Back')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(fastEmbed),
                new ButtonBuilder()
                    .setCustomId('paginate_stop')
                    .setLabel('Stop')
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId('paginate_next')
                    .setLabel('Next')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(lastEmbed),
                new ButtonBuilder()
                    .setCustomId('paginate_last')
                    .setLabel('Last')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(lastEmbed),
            );
        return { embeds: [pageEmbed], components: [row] };
    }
    const msgOptions = getButton(0);
    const message = ctx instanceof Message ? await ctx.channel.send(msgOptions) : await ctx.reply(msgOptions);
    const filter = (interaction) => {
        if (ctx instanceof Message) {
            return interaction.user.id === ctx.author.id;
        } else if (ctx instanceof ChatInputCommandInteraction) {
            return interaction.user.id === ctx.user.id;
        }
        return false;
    };
    const collector = message.createMessageComponentCollector({
        filter,
        time: 60_000,
    });
    collector.on('collect', async (interaction) => {
        if (interaction.customId === 'paginate_back') {
            page--;
        } else if (interaction.customId === 'paginate_next') {
            page++;
        } else if (interaction.customId === 'paginate_stop') {
            collector.stop();
            return;
        } else if (interaction.customId === 'paginate_first') {
            page = 0;
        } else if (interaction.customId === 'paginate_last') {
            page = embed.length - 1;
        }
        await interaction.update(getButton(page));
    });

    collector.on('end', async () => {
        if (message && message.editable) {
            await BotUtils.handleCollectorEnd(message).catch(() => { });
        }
    });
    return message;
}

;