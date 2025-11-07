import { EmbedBuilder, GuildMember } from 'discord.js';
import { BotClient, ChatInputCommandInteraction, Command, Message } from '../../structures/index';
import { MusicCheck } from '../../helpers/decorators/Music';


export default class FixVoiceCommand extends Command {
    constructor(client: BotClient) {
        super(client, {
            name: 'fixvoice',
            description: {
                content: 'Fix voice channel.',
                usage: 'fixvoice',
                examples: ['fixvoice'],
            },
            aliases: ['fixvc'],
            category: 'music',
            cooldown: 5,
            args: false,
            permissions: {
                dev: false,
                client: ['SendMessages', 'ViewChannel', 'EmbedLinks'],
                user: ['ManageGuild'],
            },
            slashCommand: true,
        });
    }

    public async messageRun(message: Message, args: string[]): Promise<any> {
        return this.fixVoice(message);
    }

    public async slashRun(interaction: ChatInputCommandInteraction): Promise<any> {
        return this.fixVoice(interaction);
    }
    @MusicCheck()
    private async fixVoice(ctx: ChatInputCommandInteraction | Message): Promise<any> {
        const embed = new EmbedBuilder().setColor(this.client.config.colors.main);
        let player = this.client.queue.getPlayer(ctx.guild.id);
        if (player) {
            if (!ctx.guild.members.me.voice) {
                player.destroy(true);
                player = await this.client.queue.createPlayer({
                    guild: ctx.guild,
                    textChannelId: ctx.channel.id,
                    voiceChannelId: ctx.member instanceof GuildMember ? ctx.member.voice.channel.id : null,
                    voiceMember: ctx.member instanceof GuildMember ? ctx.member : null,
                });
                ctx instanceof Message ? ctx.safeReply({ embeds: [embed.setDescription(`\`✅\` Voice channel is now fixed.`)] }) : ctx.reply({ embeds: [embed.setDescription(`\`✅\` Voice channel is now fixed.`)] });
                return;
            } else {
                ctx instanceof Message ? ctx.safeReply({ embeds: [embed.setDescription(`\`❌\` I'm already connected to a voice channel.`)] }) : ctx.reply({ embeds: [embed.setDescription(`\`❌\` I'm already connected to a voice channel.`)] });
                return;
            }
        } else {
            player = await this.client.queue.createPlayer({
                guild: ctx.guild,
                textChannelId: ctx.channel.id,
                voiceChannelId: ctx.member instanceof GuildMember ? ctx.member.voice.channel.id : null,
                voiceMember: ctx.member instanceof GuildMember ? ctx.member : null,
            });
            ctx instanceof Message ? ctx.safeReply({ embeds: [embed.setDescription(`\`✅\` Voice channel is now fixed.`)] }) : ctx.reply({ embeds: [embed.setDescription(`\`✅\` Voice channel is now fixed.`)] });
            return;
        }
    }
}
