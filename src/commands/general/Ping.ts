import { EmbedBuilder } from 'discord.js';
import { BotClient, ChatInputCommandInteraction, Command, Message } from '../../structures/index';


export default class Ping extends Command {
    constructor(client: BotClient) {
        super(client, {
            name: 'ping',
            description: {
                content: "Shows the bot's ping",
                examples: ['ping'],
                usage: 'ping',
            },
            category: 'general',
            aliases: ['pong'],
            cooldown: 3,
            args: false,
            permissions: {
                dev: false,
                client: ['SendMessages', 'ViewChannel', 'EmbedLinks'],
                user: [],
            },
            slashCommand: true,
            options: [],
        });
    }
    public async messageRun(message: Message, _args: string[]): Promise<any> {
        const msg = await message.channel.send('Pinging...');

        const embed = new EmbedBuilder()
            .setAuthor({ name: 'Pong', iconURL: this.client.user.displayAvatarURL() })
            .setColor(this.client.config.colors.main)
            .setDescription(`\`🏓\` **Bot:** \`[ ${Math.round(Date.now() - message.createdTimestamp)}ms ]\` ● **API:** \`[ ${Math.round(this.client.ws.ping)}ms ]\``)
            .setTimestamp();
        if (msg) {
            return await msg.edit({ content: null, embeds: [embed] }).catch(() => {
                null;
            });
        }
    }

    public async slashRun(interaction: ChatInputCommandInteraction): Promise<any> {
        await interaction.reply('Pinging...').catch(() => {
            null;
        });
        const embed = new EmbedBuilder()
            .setAuthor({ name: 'Pong', iconURL: this.client.user.displayAvatarURL() })
            .setColor(this.client.config.colors.main)
            .setDescription(`\`🏓\` **Bot:** \`[ ${Math.round(Date.now() - interaction.createdTimestamp)}ms ]\` ● **API:** \`[ ${Math.round(this.client.ws.ping)}ms ]\``)
            .setTimestamp();
        return await interaction.editReply({ content: null, embeds: [embed] });
    }
}
