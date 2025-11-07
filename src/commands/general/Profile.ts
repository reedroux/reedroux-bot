import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from 'discord.js';
import { BotClient, ChatInputCommandInteraction, Command, Message } from '../../structures/index';

export default class Profile extends Command {
    constructor(client: BotClient) {
        super(client, {
            name: 'profile',
            description: {
                content: 'Shows the profile of the user.',
                usage: 'profile',
                examples: ['profile'],
            },
            aliases: ['prof', 'pfp'],
            category: 'general',
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
        return this.handle(message);
    }

    public async slashRun(interaction: ChatInputCommandInteraction): Promise<any> {
        return this.handle(interaction);
    }

    private async handle(ctx: ChatInputCommandInteraction | Message): Promise<any> {
        const embed = new EmbedBuilder().setColor(this.client.config.colors.main);
        const data = await this.client.db.getUser('author' in ctx ? ctx.author.id : ctx.user.id);
        // Removed lastFmdata fetching as it's no longer needed
        if (!data) {
            return ctx instanceof Message 
                ? ctx.safeReply({ embeds: [embed.setDescription('No data found.')] }) 
                : ctx.reply({ embeds: [embed.setDescription('No data found.')] });
        }

        const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
                .setLabel('Vote Me')
                .setEmoji({ id: '1220994256894955531', name: 'w_topgg' })
                .setStyle(ButtonStyle.Link)
                .setURL(this.client.config.links.vote),
        );

        const msg = [
            'Vote for the bot to unlock premium features and earn extra credits!',
            'Earn credits and unlock premium features by voting for the bot!',
            'Help support the bot and unlock premium features by voting!',
            'Voting for the bot can earn you credits and unlock premium features!',
            'Unlock premium features and earn credits by voting for the bot!',
            'Want more credits and premium features? Vote for the bot now!',
            'Show your support for the bot and earn credits to unlock premium features!',
            'Get rewarded for voting! Earn credits and unlock premium features.',
            'Don\'t miss out! Voting for the bot can earn you credits and unlock premium features!',
            'Make your vote count! Earn credits and unlock premium features by voting for the bot!',
        ];

        embed.setAuthor({ name: 'Profile', iconURL: 'author' in ctx ? ctx.author.displayAvatarURL() : ctx.user.displayAvatarURL() });
        embed.setDescription(msg[Math.floor(Math.random() * msg.length)]);

        // Removed last.fm-related fields
        const fields = [
            {
                name: 'Votes:',
                value: data.voteCount ? data.voteCount.toString() : '0',
                inline: true,
            },
            {
                name: 'Credits:',
                value: data.voteCount ? `${data.voteCount - data.voteClaimed}$` : '0$',
                inline: true,
            },
            {
                name: 'Updated At:',
                value: `<t:${Math.floor(data.updatedAt.getTime() / 1000)}:R>`,
                inline: true,
            }
        ];

        embed.addFields(fields);

        return ctx instanceof Message 
            ? ctx.safeReply({ embeds: [embed], components: [buttonRow] }) 
            : ctx.reply({ embeds: [embed], components: [buttonRow] });
    }
}
