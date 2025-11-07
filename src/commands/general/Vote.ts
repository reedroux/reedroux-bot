import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from 'discord.js';
import { BotClient, ChatInputCommandInteraction, Command, Message } from '../../structures/index';

export default class VoteCommand extends Command {
    constructor(client: BotClient) {
        super(client, {
            name: 'vote',
            description: {
                content: 'Get the vote link for the bot',
                usage: 'vote',
                examples: ['vote'],
            },
            category: 'general',
            aliases: ['voting', 'v', 'votes'],
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
        const button = new ButtonBuilder()
            .setStyle(ButtonStyle.Link)
            .setLabel('Vote Me')
            .setEmoji({ id: '1220994256894955531', name: 'w_topgg' })
            .setURL(this.client.config.links.vote);
        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(button);
        const embed = new EmbedBuilder().setColor(this.client.config.colors.main).setDescription(msg[Math.floor(Math.random() * msg.length)]);

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