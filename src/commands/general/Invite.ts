import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { BotClient, ChatInputCommandInteraction, Command, Message } from '../../structures/index';

export default class InviteCommand extends Command {
    constructor(client: BotClient) {
        super(client, {
            name: 'invite',
            description: {
                content: 'Get the invite link for the bot',
                usage: 'invite',
                examples: ['invite'],
            },
            messageCommand: false,
            category: 'general',
            aliases: ['invites', 'inv'],
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
        const button = new ButtonBuilder()
            .setStyle(ButtonStyle.Link)
            .setLabel('Invite Me')
            .setURL(this.client.getInvite());
        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(button);
        const content = `Click [here](${this.client.getInvite()}) to invite me!\nOr click the button below!`;
        if (ctx instanceof Message) {
            return ctx.safeReply({
                content,
                components: [row],
            });
        }
        return ctx.reply({
            content,
            components: [row],
        });
    }
}
