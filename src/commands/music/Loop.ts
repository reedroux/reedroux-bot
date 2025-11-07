import { BotClient, ChatInputCommandInteraction, Command, Message } from '../../structures/index';
import { MusicCheck } from '../../helpers/decorators/Music';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from 'discord.js';
import { LoopMode } from '../../structures/music/Dispatcher';


export default class Loop extends Command {
    constructor(client: BotClient) {
        super(client, {
            name: 'loop',
            description: {
                content: 'Loop the current song or the queue',
                usage: 'loop [queue|song|off]',
                examples: ['loop', 'loop queue', 'loop song', 'loop off'],
            },
            aliases: ['repeat'],
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
                    name: "type",
                    description: "The type of loop to set",
                    type: 3,
                    required: true,
                    choices: [
                        {
                            name: "queue",
                            value: "queue"
                        },
                        {
                            name: "song",
                            value: "song"
                        },
                        {
                            name: "off",
                            value: "off"
                        }
                    ]
                }
            ],
        });
    }
    @MusicCheck({
        inVoice: true,
        sameVoice: true,
        player: {
            requireQueue: true,
        }
    })
    public async messageRun(message: Message, args: string[]): Promise<any> {
        const type = args[0];
        const player = this.client.queue.getPlayer(message.guild.id);
        const embed = new EmbedBuilder().setColor(this.client.config.colors.main).setAuthor({ name: message.guild.name, iconURL: message.guild.iconURL() })
        if (!type) {
            const queueButton = new ButtonBuilder().setCustomId('loop_queue').setLabel('Queue').setStyle(ButtonStyle.Primary);
            const songButton = new ButtonBuilder().setCustomId('loop_song').setLabel('Song').setStyle(ButtonStyle.Primary);
            const offButton = new ButtonBuilder().setCustomId('loop_off').setLabel('Off').setStyle(ButtonStyle.Primary);
            const row = new ActionRowBuilder<ButtonBuilder>().addComponents(queueButton, songButton, offButton);

            embed.setDescription('Select the type of loop you want to set')

            const msg = await message.reply({ embeds: [embed], components: [row] });

            const filter = (i) => i.user.id === message.author.id;

            const collector = msg.createMessageComponentCollector({ filter, time: 15000 });

            collector.on('collect', async i => {
                if (i.customId === 'loop_queue') {
                    if (player.repeat !== 'queue') {
                        player.repeat = LoopMode.Queue;
                        embed.setDescription('\`✅\` Successfully turned on the loop mode for the queue');
                        await this.client.update(i, { embeds: [embed] })
                    } else {
                        player.repeat = LoopMode.Off;
                        embed.setDescription('\`✅\` Successfully turned off the loop mode');
                        await this.client.update(i, { embeds: [embed] })
                    }

                } else if (i.customId === 'loop_song') {
                    if (player.repeat !== 'song') {
                        player.repeat = LoopMode.Song;
                        embed.setDescription('\`✅\` Successfully turned on the loop mode for the song');
                        await this.client.update(i, { embeds: [embed] })
                    } else {
                        player.repeat = LoopMode.Off;
                        embed.setDescription('\`✅\` Successfully turned off the loop mode');
                        await this.client.update(i, { embeds: [embed] })
                    }
                } else if (i.customId === 'loop_off') {
                    if (player.repeat !== 'off') {
                        player.repeat = LoopMode.Off;
                        embed.setDescription('\`✅\` Successfully turned off the loop mode');
                        await this.client.update(i, { embeds: [embed] })
                    } else {
                        player.repeat = LoopMode.Off;
                        embed.setDescription('\`❌\` The loop mode is already off');
                        await this.client.update(i, { embeds: [embed] })
                    }
                }
            });

            collector.on('end', async () => {
                queueButton.setDisabled(true);
                songButton.setDisabled(true);
                offButton.setDisabled(true);
                row.addComponents(queueButton, songButton, offButton);
                await msg?.edit({ components: [row] }).catch(() => { });
            });
        } else {
            if (type === 'queue') {
                if (player.repeat !== 'queue') {
                    player.repeat = LoopMode.Queue;
                    return message.safeReply({
                        embeds: [embed.setDescription('\`✅\` Successfully turned on the loop mode for the queue')]
                    });
                } else {
                    player.repeat = LoopMode.Off;
                    return message.safeReply({
                        embeds: [embed.setDescription('\`✅\` Successfully turned off the loop mode')]
                    });
                }
            } else if (type === 'song') {
                if (player.repeat !== 'song') {
                    player.repeat = LoopMode.Song;
                    embed.setDescription('\`✅\` Successfully turned on the loop mode for the song');
                    return message.safeReply({
                        embeds: [embed]
                    });
                } else {
                    player.repeat = LoopMode.Off;
                    return message.safeReply({
                        embeds: [embed.setDescription('\`✅\` Successfully turned off the loop mode')]
                    });
                }
            } else if (type === 'off') {
                if (player.repeat !== 'off') {
                    player.repeat = LoopMode.Off;
                    return message.safeReply({
                        embeds: [embed.setDescription('\`✅\` Successfully turned off the loop mode')]
                    });
                } else {
                    return message.safeReply({
                        embeds: [embed.setDescription('\`❌\` The loop mode is already off')]
                    });
                }
            }
        }
    }

    @MusicCheck({
        inVoice: true,
        sameVoice: true,
        player: {
            requireQueue: true,
        }
    })
    public async slashRun(interaction: ChatInputCommandInteraction): Promise<any> {
        const type = interaction.options.getString('type');

        const player = this.client.queue.getPlayer(interaction.guildId);
        const embed = new EmbedBuilder().setColor(this.client.config.colors.main).setAuthor({ name: interaction.guild.name, iconURL: interaction.guild.iconURL() })

        switch (type) {
            case 'queue':
                if (player.repeat !== 'queue') {
                    player.repeat = LoopMode.Queue;
                    return interaction.reply({
                        embeds: [embed.setDescription('\`✅\` Successfully turned on the loop mode for the queue')]
                    });
                } else {
                    player.repeat = LoopMode.Off;
                    return interaction.reply({
                        embeds: [embed.setDescription('\`✅\` Successfully turned off the loop mode')]
                    });
                }
            case 'song':
                if (player.repeat !== 'song') {
                    player.repeat = LoopMode.Song;
                    embed.setDescription('\`✅\` Successfully turned on the loop mode for the song');
                    return interaction.reply({
                        embeds: [embed]
                    });
                } else {
                    player.repeat = LoopMode.Off;
                    return interaction.reply({
                        embeds: [embed.setDescription('\`✅\` Successfully turned off the loop mode')]
                    });
                }
            case 'off':
                if (player.repeat !== 'off') {
                    player.repeat = LoopMode.Off;
                    return interaction.reply({
                        embeds: [embed.setDescription('\`✅\` Successfully turned off the loop mode')]
                    });
                } else {
                    return interaction.reply({
                        embeds: [embed.setDescription('\`❌\` The loop mode is already off')]
                    });
                }

        }
    }
}
