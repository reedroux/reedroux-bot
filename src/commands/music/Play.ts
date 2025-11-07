
import {
    ActionRowBuilder,
    ApplicationCommandOptionType,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    Guild,
    GuildMember,
    TextChannel,
} from 'discord.js';
import { BotClient, ChatInputCommandInteraction, Command, Message } from '../../structures/index';
import { LoadType } from 'shoukaku';
import { Song } from '../../structures/music/Dispatcher';
import { MusicCheck } from '../../helpers/decorators/Music';
import { isPremiumOrGuild } from '../../helpers/Checkes';

export default class Play extends Command {
    constructor(client: BotClient) {
        super(client, {
            name: 'play',
            description: {
                content: 'Play a song or add it to the queue for the bot to play.',
                usage: 'play <song>',
                examples: ['play never gonna give you up'],
            },
            aliases: ['p'],
            category: 'music',
            cooldown: 5,
            args: true,
            permissions: {
                dev: false,
                client: ['SendMessages', 'ViewChannel', 'EmbedLinks'],
                user: [],
            },
            slashCommand: true,
            options: [
                {
                    name: 'query',
                    description: 'The song you want to play',
                    type: ApplicationCommandOptionType.String,
                    required: true,
                },
            ],
        });
    }

    @MusicCheck()
    public async messageRun(message: Message, args: string[]): Promise<any> {
        const query = args.join(' ');
        const res = await this.play(
            {
                member: message.member,
                guild: message.guild,
                channel: message.channel as TextChannel,
            },
            query
        );

        return message.safeReply(res);
    }

    @MusicCheck()
    public async slashRun(interaction: ChatInputCommandInteraction): Promise<any> {
        const query = interaction.options.getString('query', true);
        if (!interaction.deferred) await interaction.deferReply().catch(() => null);
        const res = await this.play(
            {
                member: interaction.member as GuildMember,
                guild: interaction.guild as Guild,
                channel: interaction.channel as TextChannel,
            },
            query
        );
        return interaction.editReply(res);
    }

    private async play(
        { member, guild, channel }: { member: GuildMember; guild: Guild; channel: TextChannel },
        query: string
    ): Promise<{ embeds: any[], components?: any[] } | string> {
        let player = this.client.queue.getPlayer(guild.id);
        let embed = new EmbedBuilder().setAuthor({
            name: member.user.globalName ? member.user.globalName : member.user.username,
            iconURL: member.user.avatarURL(),
        });

        // Check if the input is a URL
        const isUrl = query.startsWith('http://') || query.startsWith('https://');
        const node = this.client.shoukaku.options.nodeResolver(this.client.shoukaku.nodes);
        if (!node) {
            embed
                .setColor(this.client.config.colors.red)
                .setDescription(
                    '`❌` Please try again later, the bot is currently not connected to any voice channel.'
                );
            return { embeds: [embed] };
        }

        // Perform a search based on the query (URL or search term)
        const res = await this.client.queue.search(query);

        if (res.loadType === LoadType.EMPTY) {
            embed
                .setColor(this.client.config.colors.red)
                .setDescription('`❌` There were no search results.');
            return { embeds: [embed] };
        } else if (res.loadType === LoadType.ERROR) {
            embed
                .setColor(this.client.config.colors.red)
                .setAuthor({ name: 'Error', iconURL: member.user.avatarURL() })
                .setDescription('`❌` There was an error while searching.');
            return { embeds: [embed] };
        } else if (res.loadType === LoadType.PLAYLIST) {
            const isUserPremium = await isPremiumOrGuild(guild.id, member.user.id);
            const row = new ActionRowBuilder<ButtonBuilder>()
                .addComponents(
                    new ButtonBuilder()
                        .setLabel('Premium')
                        .setStyle(ButtonStyle.Link)
                        .setURL(this.client.config.links.patreon)
                        .setEmoji({ id: "1220994440248819742" })
                );
            if (res.data.tracks.length > 100 && !isUserPremium) {
                embed
                    .setColor(this.client.config.colors.red)
                    .setDescription(
                        `\`❌\` You can only add up to 100 tracks to the queue. [Upgrade to premium](${this.client.config.links.patreon}) to add more.`
                    );
                return { embeds: [embed], components: [row] };
            }
            for (const track of res.data.tracks) {
                if (player && player.textChannel === null) player.textChannel = channel.id;
                if (!player) {
                    player = await this.client.queue.createPlayer({
                        guild: guild,
                        textChannelId: channel.id,
                        voiceChannelId: member.voice.channel.id,
                        voiceMember: member,
                    });
                }
                const parseTrack = new Song(track, member);
                if (!parseTrack.info.title) continue;
                player.queue.push(parseTrack);
            }
            player.checkToPlay();
            embed
                .setColor(this.client.config.colors.main)
                .setAuthor({ name: 'Playlist added', iconURL: member.user.avatarURL() })
                .setDescription(
                    `\`➕\` Added \`${res.data.tracks.length}\` tracks from [${res.data.info.name || "Unknown Playlist"}](${query}) to the queue.`
                );
            return { embeds: [embed] };
        } else if (res.loadType === LoadType.TRACK || res.loadType === LoadType.SEARCH) {
            // Handle individual track or search results
            if (player && player.textChannel === null) player.textChannel = channel.id;
            if (!player) {
                player = await this.client.queue.createPlayer({
                    guild: guild,
                    textChannelId: channel.id,
                    voiceChannelId: member.voice.channel.id,
                    voiceMember: member,
                });
            }

            const parseTrack = new Song(res.data[0], member);
            if (!parseTrack.info.title) return '`❌` This track is not available.';
            player.queue.push(parseTrack);
            player.checkToPlay();
            embed
                .setColor(this.client.config.colors.main)
                .setAuthor({ name: 'Track added', iconURL: member.user.avatarURL() })
                .setDescription(
                    `\`➕\` Added [${parseTrack.info.title}](${parseTrack.info.uri}) by \`${parseTrack.info.author}\` to the queue${player.queue.length ? ` at position **#${player.queue.length}**.` : '.'}`
                );
            return { embeds: [embed] };
        }
    }
}
