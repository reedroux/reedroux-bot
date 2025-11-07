import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from 'discord.js';
import { BotClient, ChatInputCommandInteraction, Command, Message } from '../../structures/index';

export default class SupportCommand extends Command {
    constructor(client: BotClient) {
        super(client, {
            name: 'support',
            description: {
                content: 'Get the support server link for the bot',
                usage: 'support',
                examples: ['support'],
            },
            category: 'general',
            aliases: ['server', 'sup', 'supports'],
            cooldown: 5,
            args: false,
            permissions: {
                dev: false,
                client: ['SendMessages', 'ViewChannel', 'EmbedLinks'],
                user: [],
            },
            slashCommand: true,
        });
    }
    public async messageRun(message: Message, args: string[]): Promise<any> {
        return this.sendMsg(message);
    }
    public async slashRun(interaction: ChatInputCommandInteraction): Promise<any> {
        return this.sendMsg(interaction);
    }

    private sendMsg(ctx: ChatInputCommandInteraction | Message) {
        const embed = new EmbedBuilder().setColor(this.client.config.colors.main);
        const button = new ButtonBuilder()
            .setStyle(ButtonStyle.Link)
            .setLabel('Support Server')
            .setURL(this.client.config.links.supportServer);
        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(button);
        embed.setDescription(`Are you having trouble with the bot? Join our [support server](${this.client.config.links.supportServer}) for help!\n- Or click the button below!`);
        if (ctx instanceof Message) {
            return ctx.safeReply({
                embeds: [embed],
                components: [row],
            });
        }
        return ctx.reply({
            embeds: [embed],
            components: [row],
        });
    }
}
