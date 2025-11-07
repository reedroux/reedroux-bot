import { Song } from '../../structures/music/Dispatcher';
import {
    BotClient,
    ChatInputCommandInteraction,
    ApplicationCommandOptionType,
    Command,
    Message,
} from '../../structures/index';
import { LoadType } from 'shoukaku';
import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    Guild,
    GuildMember,
    ModalBuilder,
    TextChannel,
    TextInputBuilder,
    TextInputStyle,
} from 'discord.js';
import { MusicCheck } from '../../helpers/decorators/Music';
import { SourceType } from '../../structures/music/Queue';
import BotUtils from '../../utils/BotUtils';
import { isPremiumOrGuild } from '../../helpers/Checkes';


export default class SourceCommand extends Command {
    constructor(client: BotClient) {
        super(client, {
            name: 'source',
            description: {
                content: 'Play a song from a source',
                usage: 'source <source> <song>',
                examples: [
                    'source spotify never gonna give you up',
                    'source soundcloud never gonna give you up',
                    'source deezer never gonna give you up',
                    'source apple never gonna give you up',
                ],
            },
            aliases: ['ps'],
            category: 'music',
            cooldown: 5,
            args: false,
            permissions: {
                dev: false,
                client: ['SendMessages', 'ViewChannel', 'EmbedLinks'],
                user: [],
            },
            slashCommand: true,
            options: [
                {
                    name: 'spotify',
                    description: 'The song you want to play from spotify',
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: 'query',
                            description: 'The song you want to play',
                            type: ApplicationCommandOptionType.String,
                            required: true,
                        },
                    ],
                },
                {
                    name: 'soundcloud',
                    description: 'The song you want to play from soundcloud',
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: 'query',
                            description: 'The song you want to play',
                            type: ApplicationCommandOptionType.String,
                            required: true,
                        },
                    ],
                },
                {
                    name: 'deezer',
                    description: 'The song you want to play from deezer',
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: 'query',
                            description: 'The song you want to play',
                            type: ApplicationCommandOptionType.String,
                            required: true,
                        },
                    ],
                },
                {
                    name: 'apple',
                    description: 'The song you want to play from apple music',
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: 'query',
                            description: 'The song you want to play',
                            type: ApplicationCommandOptionType.String,
                            required: true,
                        },
                    ],
                },
            ],
        });
    }
    @MusicCheck()
    public async messageRun(message: Message, args: string[]): Promise<any> {
        const subCommand = args.shift()?.toLowerCase();
        if (!subCommand) {
            const embed = new EmbedBuilder()
                .setColor(this.client.config.colors.main)
                .setDescription(
                    `Select a source to play a song by clicking on the buttons below.`
                );
            const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
                new ButtonBuilder()
                    .setCustomId(SourceType.SPOTIFY)
                    .setLabel('Spotify')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId(SourceType.SOUNDCLOUD)
                    .setLabel('Soundcloud')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId(SourceType.DEEZER)
                    .setLabel('Deezer')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId(SourceType.APPLE)
                    .setLabel('Apple')
                    .setStyle(ButtonStyle.Secondary)
            );
            const msg = await message.channel.send({ embeds: [embed], components: [row] });
            const filter = i => i.user.id === message.author.id;
            const collector = msg.createMessageComponentCollector({ filter, time: 30000 });
            collector.on('collect', async i => {
                if (
                    i.customId === SourceType.SPOTIFY ||
                    i.customId === SourceType.SOUNDCLOUD ||
                    i.customId === SourceType.DEEZER ||
                    i.customId === SourceType.APPLE
                ) {
                    const modal = new ModalBuilder().setCustomId('SOURCE_MODAL').setTitle('Search');

                    const Input = new TextInputBuilder()
                        .setCustomId('SOURCE_INPUT')
                        .setPlaceholder('Enter song name or paste URL to play')
                        .setLabel('Input')
                        .setMinLength(1)
                        .setMaxLength(100)
                        .setRequired(true)
                        .setStyle(TextInputStyle.Paragraph);
                    const modalComponent = new ActionRowBuilder<TextInputBuilder>().addComponents(
                        Input
                    );
                    modal.addComponents(modalComponent);
                    await i.showModal(modal);
                }
                await i
                    .awaitModalSubmit({ time: 60_000, filter })
                    .then(async interaction => {
                        if (interaction.customId === 'SOURCE_MODAL') {
                            const query = interaction.fields.getTextInputValue('SOURCE_INPUT');
                            const res = await this.play(
                                {
                                    member: message.member,
                                    guild: message.guild,
                                    channel:
                                        message.channel instanceof TextChannel
                                            ? message.channel
                                            : null,
                                },
                                query,
                                i.customId as SourceType
                            );
                            return interaction.reply(res);
                        }
                    })
                    .catch(() => {
                        return i.reply({
                            content: 'You took too long to respond.',
                            ephemeral: true,
                        });
                    });
            });

            collector.on('end', async () => {
                if (msg instanceof Message && msg.editable) {
                    await BotUtils.handleCollectorEnd(msg).catch(() => { });
                }
            });
        } else {
            let source: SourceType;
            if (['spotify', 'sp'].includes(subCommand)) source = SourceType.SPOTIFY;
            if (['soundcloud', 'sc'].includes(subCommand)) source = SourceType.SOUNDCLOUD;
            if (['deezer', 'dz'].includes(subCommand)) source = SourceType.DEEZER;
            if (['apple', 'ap'].includes(subCommand)) source = SourceType.APPLE;

            if (!source) {
                return message.safeReply(
                    'Please provide a valid source. (spotify, soundcloud, deezer, apple)\nExample: `source spotify never gonna give you up`'
                );
            }
            if (source && ![SourceType.SPOTIFY, SourceType.SOUNDCLOUD, SourceType.DEEZER, SourceType.APPLE].includes(source)) {
                return message.safeReply(
                    'Please provide a valid source. (spotify, soundcloud, deezer, apple)\nExample: `source spotify never gonna give you up`'
                );
            }
            const query = args.join(' ');
            const res = await this.play(
                {
                    member: message.member,
                    guild: message.guild,
                    channel: message.channel instanceof TextChannel ? message.channel : null,
                },
                query,
                source
            );
            return message.safeReply(res);
        }
    }
    @MusicCheck()
    public async slashRun(interaction: ChatInputCommandInteraction): Promise<any> {
        const subCommand = interaction.options.getSubcommand(true);
        if (!interaction.deferred) await interaction.deferReply().catch(() => null);
        let source: SourceType;
        switch (subCommand) {
            case 'spotify':
                source = SourceType.SPOTIFY;
                break;
            case 'soundcloud':
                source = SourceType.SOUNDCLOUD;
                break;
            case 'deezer':
                source = SourceType.DEEZER;
                break;
            case 'apple':
                source = SourceType.APPLE;
                break;
        }
        const query = interaction.options.getString('query', true);
        const res = await this.play(
            {
                member: interaction.member as GuildMember,
                guild: interaction.guild as Guild,
                channel: interaction.channel as TextChannel,
            },
            query,
            source
        );
        return interaction.editReply(res);
    }

    private async play(
        { member, guild, channel }: { member: GuildMember; guild: Guild; channel: TextChannel },
        query: string,
        source: SourceType
    ): Promise<{ embeds: any[], components?: any[] } | string> {
        let player = this.client.queue.getPlayer(guild.id);
        let embed = new EmbedBuilder().setAuthor({
            name: member.user.globalName ? member.user.globalName : member.user.username,
            iconURL: member.user.avatarURL(),
        });
        const node = this.client.shoukaku.options.nodeResolver(this.client.shoukaku.nodes);
        if (!node) {
            embed
                .setColor(this.client.config.colors.red)
                .setDescription(
                    '\`❌\` Please try again later, the bot is currently not connected to any voice channel.'
                );
            return { embeds: [embed] };
        }
        const res = await this.client.queue.search(query, source);
        if (res.loadType === LoadType.EMPTY) {
            embed
                .setColor(this.client.config.colors.red)
                .setDescription('\`❌\` There were no search results.');
            return { embeds: [embed] };
        } else if (res.loadType === LoadType.ERROR) {
            embed
                .setColor(this.client.config.colors.red)
                .setAuthor({ name: 'Error', iconURL: member.user.avatarURL() })
                .setDescription('\`❌\` There was an error while searching.');
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
                    `\`➕\` Added \`${res.data.tracks.length}\` tracks from [${res.data.info.name}](${query}) to the queue.`
                );
            return { embeds: [embed] };
        } else if (res.loadType === LoadType.TRACK) {
            if (player && player.textChannel === null) player.textChannel = channel.id;
            if (!player) {
                player = await this.client.queue.createPlayer({
                    guild: guild,
                    textChannelId: channel.id,
                    voiceChannelId: member.voice.channel.id,
                    voiceMember: member,
                });
            }
            const parseTrack = new Song(res.data, member);
            if (!parseTrack.info.title) return `- This track is not available.`;
            player.queue.push(parseTrack);
            player.checkToPlay();
            embed
                .setColor(this.client.config.colors.main)
                .setAuthor({ name: 'Track added', iconURL: member.user.avatarURL() })
                .setDescription(
                    `\`➕\` Added [${parseTrack.info.title}](${parseTrack.info.uri}) by \`${parseTrack.info.author}\` to the queue${player.queue.length ? ` at position **#${player.queue.length}**.` : '.'}`
                );
            return { embeds: [embed] };
        } else if (res.loadType === LoadType.SEARCH) {
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
            if (!parseTrack.info.title) return `\`❌\` This track is not available.`;
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
