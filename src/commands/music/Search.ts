import { BotClient, ChatInputCommandInteraction, Command, Message } from '../../structures/index';
import { MusicCheck } from '../../helpers/decorators/Music';
import { ActionRowBuilder, ComponentType, EmbedBuilder, GuildMember, StringSelectMenuBuilder } from 'discord.js';
import { LoadType } from 'shoukaku';
import { Song } from '../../structures/music/Dispatcher';
import { SourceType } from '../../structures/music/Queue';

export default class Search extends Command {
    constructor(client: BotClient) {
        super(client, {
            name: 'search',
            description: {
                content: 'Search for a song and add it to the queue.',
                usage: 'search <query>',
                examples: ['search never gonna give you up'],
            },
            aliases: ['find'],
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
                    description: 'The song you want to search for',
                    type: 3,
                    required: true,
                },
            ],
        });
    }
    @MusicCheck()
    public async messageRun(message: Message, args: string[]): Promise<any> {
        return this.search(message, args.join(' '), message.member);
    }
    @MusicCheck()
    public async slashRun(interaction: ChatInputCommandInteraction): Promise<any> {
        return this.search(interaction, interaction.options.getString('query', true), interaction.member as GuildMember);
    }

    private async search(ctx: ChatInputCommandInteraction | Message, query: string, member: GuildMember): Promise<any> {
        const embed = new EmbedBuilder().setColor(this.client.config.colors.main);
        let player = this.client.queue.getPlayer(ctx.guild.id);

        const res = await this.client.queue.search(query, SourceType.SPOTIFY);
        if (res.loadType === LoadType.ERROR) {
            return ctx instanceof Message ? ctx.safeReply({ embeds: [embed.setDescription('\`❌\` An error occurred while searching.')] }) : ctx.reply({ embeds: [embed.setDescription('\`❌\` An error occurred while searching.')] });
        } else if (res.loadType === LoadType.EMPTY) {
            return ctx instanceof Message ? ctx.safeReply({ embeds: [embed.setDescription('\`❌\` No results found!')] }) : ctx.reply({ embeds: [embed.setDescription('\`❌\` No results found!')] });
        } else if (res.loadType === LoadType.PLAYLIST) {
            return ctx instanceof Message ? ctx.safeReply({ embeds: [embed.setDescription('\`❌\` Playlists are not supported!')] }) : ctx.reply({ embeds: [embed.setDescription('\`❌\` Playlists are not supported!')] });
        } else if (res.loadType === LoadType.TRACK) {
            return ctx instanceof Message ? ctx.safeReply({ embeds: [embed.setDescription(`\`❌\` Loading tracks directly is not supported! Please use the ${await this.client.printCmd("play")} command instead!`)] }) : ctx.reply({ embeds: [embed.setDescription(`\`❌\` Loading tracks directly is not supported! Please use the ${await this.client.printCmd("play")} command instead!`)] });
        } else if (res.loadType === LoadType.SEARCH) {
            let results = res.data.slice(0, 10);
            if (results.length === 0) return ctx instanceof Message ? ctx.safeReply({ embeds: [embed.setDescription('- No results found!')] }) : ctx.reply({ embeds: [embed.setDescription('\`❌\` No results found!')] })

            let n = 0;
            const str = results.map((t) => `\` ${++n} \` [${t.info.author} - ${t.info.title}](${t.info.uri})`).join("\n");
            const selectMenuArray = [];
            for (let i = 0; i < results.length; i++) {
                const track = results[i];
                let label = `${i + 1}. ${track.info.title}`;
                if (label.length > 100) label = label.substring(0, 97) + "...";
                selectMenuArray.push({
                    label: label,
                    description: track.info.author,
                    value: i.toString()
                });
            }

            const stringMenu = new ActionRowBuilder<StringSelectMenuBuilder>()
                .addComponents(
                    new StringSelectMenuBuilder()
                        .setCustomId('search_select')
                        .setPlaceholder('Select a song to add to the queue or play')
                        .addOptions(selectMenuArray)
                        .setMinValues(1)
                        .setMaxValues(results.length > 5 ? 5 : results.length)
                );

            const msg = ctx instanceof Message ? await ctx.channel.send({ embeds: [embed.setDescription(`**Search results for ${query}**\n\n${str}`)], components: [stringMenu] }) : await ctx.reply({ embeds: [embed.setDescription(`**Search results for ${query}**\n\n${str}`)], components: [stringMenu] });

            const filter = (i) => {
                if (ctx instanceof ChatInputCommandInteraction) {
                    if (i.user.id !== ctx.user.id) {
                        i.reply({ content: '\`❌\` You are not allowed to interact with this menu.', ephemeral: true });
                        return false;
                    }
                } else {
                    if (i.user.id !== ctx.author.id) {
                        i.reply({ content: '\`❌\` You are not allowed to interact with this menu.', ephemeral: true });
                        return false;
                    }
                }
                return true
            }

            const collector = msg.createMessageComponentCollector({ filter, time: 30000, componentType: ComponentType.StringSelect });
            const toAdd = [];
            let hasReceivedIndexes = false;
            let count = 0;
            collector.on('collect', async i => {
                // check if the user in voice channel
                if (!member.voice.channel) {
                    i.reply({ content: '\`❌\` You need to be in a voice channel to use this menu.', ephemeral: true });
                    return;
                }
                if (player && player.metadata.voiceChannelId !== member.voice.channel.id) {
                    i.reply({ content: '\`❌\` You need to be in the same voice channel as the bot to use this menu.', ephemeral: true });
                    return;
                }
                if (i.customId === 'search_select') {
                    for (const value of i.values) {
                        toAdd.push(res.data[value]);
                        count++;
                    }
                }
                if (player && player.textChannel === null) player.textChannel = ctx.channel.id;
                if (!player) {
                    player = await this.client.queue.createPlayer({
                        guild: ctx.guild,
                        textChannelId: ctx.channel.id,
                        voiceChannelId: member.voice.channel.id,
                        voiceMember: member,
                    });
                }
                for (let track of toAdd) {
                    const trackData = new Song(track, member);
                    player.queue.push(trackData);
                }
                hasReceivedIndexes = true;
                player.checkToPlay();
                embed
                    .setAuthor({ name: 'Tracks added', iconURL: member.user.avatarURL() })
                    .setDescription(`\`➕\` Added \`${count}\` tracks to the queue.`);
                await this.client.update(i, { embeds: [embed], components: [] });
            });

            collector.on('end', async () => {
                if (hasReceivedIndexes) return;
                await msg.edit({ embeds: [embed.setDescription('\`❌\` You did not select any tracks in time.')], components: [] }).catch(() => null);
            });
        }
    }
}