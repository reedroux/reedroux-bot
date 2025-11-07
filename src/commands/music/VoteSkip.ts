import { BotClient, ChatInputCommandInteraction, ApplicationCommandOptionType, Command, Message } from '../../structures/index';
import { MusicCheck } from '../../helpers/decorators/Music';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, GuildMember, InteractionResponse } from 'discord.js';


export default class VoteSkip extends Command {
    private response: Message | InteractionResponse;
    constructor(client: BotClient) {
        super(client, {
            name: 'voteskip',
            description: {
                content: 'Vote to skip the current song',
                usage: 'voteskip [min_votes] [max_votes] [time]',
                examples: ['voteskip', 'voteskip 3 5 2m'],
            },
            aliases: ['skipvote', 'vskip'],
            category: 'music',
            cooldown: 5,
            args: false,
            permissions: {
                dev: false,
                client: ['SendMessages', 'ViewChannel', 'EmbedLinks'],
                user: ['Connect', 'Speak'],
            },
            slashCommand: true,
            options: [
                {
                    name: "min_votes",
                    description: "The minimum votes required to skip.",
                    type: ApplicationCommandOptionType.Number,
                    required: false
                },
                {
                    name: "max_votes",
                    description: "The maximum votes required to skip.",
                    type: ApplicationCommandOptionType.Number,
                    required: false
                },
                {
                    name: "time",
                    description: "The time required for voting.",
                    type: ApplicationCommandOptionType.String,
                    required: false,
                    choices: [
                        {
                            name: "30s",
                            value: "30s"
                        },

                        {
                            name: "60s",
                            value: "60s"
                        },

                        {
                            name: "2m",
                            value: "2m"
                        },

                        {
                            name: "3m",
                            value: "3m"
                        },

                        {
                            name: "5m",
                            value: "5m"
                        }
                    ]
                }
            ],
        });
    }

    public async messageRun(message: Message, args: string[]): Promise<any> {
        return this.voteSkip(message, args);
    }

    public async slashRun(interaction: ChatInputCommandInteraction): Promise<any> {
        return this.voteSkip(interaction);
    }

    @MusicCheck({
        inVoice: true,
        sameVoice: true,
        player: {
            requireQueue: true,
        }
    })
    private async voteSkip(ctx: ChatInputCommandInteraction | Message, args?: string[]): Promise<any> {
        const embed = new EmbedBuilder().setColor(this.client.config.colors.main);
        const player = this.client.queue.getPlayer(ctx.guild.id);
        if (ctx.member instanceof GuildMember) {
            let vc = ctx.member.voice.channel;
            const voiceMembers = vc.members.filter(member => !member.user.bot);
            let min: number;
            let max: number;
            let time: string = "2m";
            if (ctx instanceof ChatInputCommandInteraction) {
                if (ctx.options.getNumber("min_votes")) min = ctx.options.getNumber("min_votes");
                if (ctx.options.getNumber("max_votes")) max = ctx.options.getNumber("max_votes");
                if (ctx.options.getString("time")) time = ctx.options.getString("time");
            } else {
                if (args[0]) min = parseInt(args[0]);
                if (args[1]) max = parseInt(args[1]);
            }
            if (!min) min = Math.ceil(voiceMembers.size / 2);
            if (!max) max = voiceMembers.size;

            if (min < 1) min = 1;
            if (max < min) max = min;
            // vote skip need at minimum 2 votes 
            if (min < 2) min = 2;
            if (max < 2) max = 2;
            if (max > voiceMembers.size) max = voiceMembers.size;
            if (min > max) min = max;


            let votersList = [];
            const fields = [];
            embed.setAuthor({ name: `Vote Skip`, iconURL: ctx.guild.iconURL() });
            embed.setDescription(`**${ctx instanceof Message ? ctx.author.globalName : ctx.user.globalName}** has started a vote to skip the current song. click the button below to vote.`);
            fields.push(
                {
                    name: "Votes:",
                    value: `0/${min}`,
                    inline: true
                },
                {
                    name: "Time:",
                    value: `${time}`,
                    inline: true
                },
                {
                    name: "Voters:",
                    value: `${votersList.length === 0 ? "No one has voted yet." : `<@${votersList.join(">, <@")}>`}`,
                    inline: false
                }
            )
            embed.addFields(fields);
            embed.setFooter({ text: `Vote will end in ${time}` });

            const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
                new ButtonBuilder()
                    .setCustomId('voteskip')
                    .setLabel('Vote Skip')
                    .setStyle(ButtonStyle.Primary)
            );

            this.response = ctx instanceof ChatInputCommandInteraction ? await ctx.channel.send({ embeds: [embed], components: [buttonRow] }) : await ctx.reply({ embeds: [embed], components: [buttonRow] });

            const collector = this.response.createMessageComponentCollector({
                filter: (b: any) => b.member.voice.channel && b.member.voice.channelId === b.guild.members.me.voice.channelId && b.customId === "voteskip" ? true : false,
                time: this.client.utils.ms(time),
                idle: this.client.utils.ms(time) / 2
            });

            collector.on('collect', async (interaction) => {
                if (interaction.member instanceof GuildMember) {
                    if (!votersList.includes(interaction.member.id)) {
                        votersList.push(interaction.member.id);
                        fields[2].value = `<@${votersList.length === 0 ? "No one has voted yet." : votersList.join(">, <@")}>`;
                        fields[0].value = `${votersList.length}/${min}`;
                        embed.setFields(fields);
                        const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
                            new ButtonBuilder()
                                .setCustomId('voteskip')
                                .setLabel(`Vote Skip ${votersList.length}/${min}`)
                                .setStyle(ButtonStyle.Primary)
                        );
                        await this.client.update(interaction, { embeds: [embed], components: [buttonRow] });
                    }
                    if (votersList.length >= min) {
                        if (player.queue.length > 0) {
                            player.skip();
                            embed.setDescription(`\`✅\` Vote has passed, and the track [${player.currentTrack.info.title}](${player.currentTrack.info.uri}) has been skipped.`);
                            embed.spliceFields(0, 3);
                            embed.setFooter(null);
                            collector.stop();
                            await this.response.edit({ embeds: [embed], components: [] });
                        }
                    }
                }
            });

            collector.on('end', async () => {
                if (votersList.length >= min) {
                    if (player.queue.length > 0) {
                        player.skip();
                        embed.setDescription(`\`✅\` Vote has passed, and the track [${player.currentTrack.info.title}](${player.currentTrack.info.uri}) has been skipped.`);
                        embed.spliceFields(0, 3);
                        embed.setFooter(null);
                        await this.response.edit({ embeds: [embed], components: [] });
                    }
                } else {
                    const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
                        new ButtonBuilder()
                            .setCustomId('voteskip')
                            .setLabel('Vote Skip')
                            .setStyle(ButtonStyle.Primary)
                            .setDisabled(true)
                    );
                    await this.response.edit({ embeds: [embed], components: [buttonRow] });
                }
            });
        }
    }
}
