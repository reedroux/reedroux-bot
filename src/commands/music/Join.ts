import { BotClient, ChatInputCommandInteraction, Command, Message } from '../../structures/index';
import { MusicCheck } from '../../helpers/decorators/Music';
import { EmbedBuilder, GuildMember } from 'discord.js';

export default class Join extends Command {
    constructor(client: BotClient) {
        super(client, {
            name: 'join',
            description: {
                content: 'Bring the bot to your voice channel',
                usage: 'join',
                examples: ['join'],
            },
            aliases: ['summon', 'connect'],
            category: 'music',
            cooldown: 5,
            args: false,
            permissions: {
                dev: false,
                client: ['SendMessages', 'ViewChannel', 'EmbedLinks', 'Connect', 'Speak'],
                user: [],
            },
            slashCommand: true,
            options: [],
        });
    }
    @MusicCheck()
    public async messageRun(message: Message, _args: string[]): Promise<any> {
        return this.joinVoiceChannel(message);
    }
    @MusicCheck()
    public async slashRun(interaction: ChatInputCommandInteraction): Promise<any> {
        return this.joinVoiceChannel(interaction);
    }

    public async joinVoiceChannel(ctx: ChatInputCommandInteraction | Message): Promise<any> {
        const embed = new EmbedBuilder().setColor(this.client.config.colors.main);

        let player = this.client.queue.getPlayer(ctx.guild.id);
        const voiceChannel = player?.player.node.manager.connections.get(ctx.guild.id)?.channelId;
        if (voiceChannel)
            return ctx instanceof Message
                ? ctx.safeReply({
                    embeds: [embed.setDescription(`\`✅\` Currently stationed in <#${voiceChannel}>`)],
                })
                : ctx.reply({
                    embeds: [embed.setDescription(`\`✅\` Currently stationed in <#${voiceChannel}>`)],
                });
        if (!player)
            player = await this.client.queue.createPlayer({
                guild: ctx.guild,
                textChannelId: ctx.channel.id,
                voiceChannelId:
                    ctx.member instanceof GuildMember ? ctx.member.voice.channel.id : null,
                voiceMember: ctx.member instanceof GuildMember ? ctx.member : null,
            });
        if (!player)
            return ctx instanceof Message
                ? ctx.safeReply({
                    embeds: [embed.setDescription("\`❌\` Failed to join the voice channel")],
                })
                : ctx.reply({
                    embeds: [embed.setDescription("\`❌\` Failed to join the voice channel")],
                });
        return ctx instanceof Message
            ? ctx.safeReply({
                embeds: [
                    embed.setDescription(
                        `\`✅\` Successfully joined <#${player.player.node.manager.connections.get(ctx.guild.id).channelId}>`
                    ),
                ],
            })
            : ctx.reply({
                embeds: [
                    embed.setDescription(
                        `\`✅\` Successfully joined <#${player.player.node.manager.connections.get(ctx.guild.id).channelId}>`
                    ),
                ],
            });
    }
}
