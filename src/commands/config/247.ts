import { EmbedBuilder, GuildMember } from 'discord.js';
import { BotClient, ChatInputCommandInteraction, Command, Message } from '../../structures/index';
import { MusicCheck } from '../../helpers/decorators/Music';

export default class TwoFourSevenCommand extends Command {
    constructor(client: BotClient) {
        super(client, {
            name: '247',
            description: {
                content: 'Toggle 24/7 mode',
                usage: '247',
                examples: ['247'],
            },
            aliases: ['twentyfourseven', '24/7'],
            category: 'config',
            cooldown: 5,
            permissions: {
                dev: false,
                client: ['SendMessages', 'ViewChannel', 'EmbedLinks'],
                user: ['ManageGuild'],
            },
            args: false,
            slashCommand: true,
        });
    }
    @MusicCheck({
        isVote: true,
    })
    public async messageRun(message: Message, args: string[]): Promise<any> {
        return await this.toggle247(message);
    }
    @MusicCheck({
        isVote: true,
    })
    public async slashRun(interaction: ChatInputCommandInteraction): Promise<any> {
        return await this.toggle247(interaction);
    }

    private async toggle247(message: Message | ChatInputCommandInteraction): Promise<any> {
        const data = await this.client.db.get247(message.guild!.id);
        let player = this.client.queue.getPlayer(message.guild!.id);
        const embed = new EmbedBuilder()
            .setColor(this.client.config.colors.main);
        if (data && data.mode) {
            await this.client.db.update247({
                guildId: message.guild!.id,
                moderatorId: message instanceof Message ? message.author.id : message.user.id,
                mode: false,
                voiceChannelId: null,
                textChannelId: null,
            });
            embed.setDescription('\`✅\` Successfully turned off 24/7 mode');
        } else {
            if (!player) {
                player = await this.client.queue.createPlayer({
                    guild: message.guild!,
                    textChannelId: message.channel.id,
                    voiceChannelId:
                        message.member instanceof GuildMember
                            ? message.member.voice.channelId
                            : null,
                });
            }
            await this.client.db.update247({
                guildId: message.guild!.id,
                moderatorId: message instanceof Message ? message.author.id : message.user.id,
                mode: true,
                voiceChannelId:
                    message.member instanceof GuildMember ? message.member.voice.channelId : null,
                textChannelId: message.channel.id,
            });
            embed.setDescription('\`✅\` Successfully turned on 24/7 mode');
        }
        message instanceof Message
            ? await message.safeReply({ embeds: [embed] })
            : await message.reply({ embeds: [embed] });
    }
}
