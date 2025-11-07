import { EmbedBuilder, VoiceChannel } from 'discord.js';
import { BotClient, ChatInputCommandInteraction, Command, Message } from '../../structures/index';
import { MusicCheck } from '../../helpers/decorators/Music';

export default class LeaveCleanup extends Command {
    constructor(client: BotClient) {
        super(client, {
            name: 'leavecleanup',
            description: {
                content: 'Removes all songs from users that are not in the voice channel.',
                usage: 'leavecleanup',
                examples: ['leavecleanup'],
            },
            aliases: ['lc'],
            category: 'music',
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
    @MusicCheck({
        isVote: true,
        player: {
            requireQueue: true,
        }
    })
    public async messageRun(message: Message, args: string[]): Promise<any> {
        return this.leaveCleanup(message);
    }
    @MusicCheck({
        isVote: true,
        player: {
            requireQueue: true,
        }
    })
    public async slashRun(interaction: ChatInputCommandInteraction): Promise<any> {
        return this.leaveCleanup(interaction);
    }

    private async leaveCleanup(ctx: ChatInputCommandInteraction | Message): Promise<any> {
        const embed = new EmbedBuilder().setColor(this.client.config.colors.main);
        const player = this.client.queue.getPlayer(ctx.guild.id);
        const channel = ctx.guild.channels.cache.get(player.player.node.manager.connections.get(ctx.guild.id).channelId);
        if (channel instanceof VoiceChannel) {
            if (channel.type !== 2) return null;
            const members = channel.members.filter(member => !member.user.bot);
            let count = 0;
            for (let i = player.queue.length - 1; i >= 0; i--) {
                const song = player.queue[i];
                if (song.info.requester && !members.some((m) => m.user.id === song.info.requester.id)) {
                    player.remove(i, true);
                    count++;
                }
            }
            ctx instanceof Message ? ctx.safeReply({ embeds: [embed.setDescription(`\`✅\` Removed ${count} songs from users that are not in the voice channel.`)] }) : ctx.reply({ embeds: [embed.setDescription(`\`✅\` Removed ${count} songs from users that are not in the voice channel.`)] });
            return;
        } else {
            ctx instanceof Message ? ctx.safeReply({ embeds: [embed.setDescription('\`❌\` The bot is not in a voice channel.')] }) : ctx.reply({ embeds: [embed.setDescription('\`❌\` The bot is not in a voice channel.')] });
            return;
        }
    }
}