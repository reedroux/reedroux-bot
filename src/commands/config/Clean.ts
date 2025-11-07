import { ChannelType, NewsChannel, TextChannel } from 'discord.js';
import {
    ApplicationCommandOptionType,
    BotClient,
    ChatInputCommandInteraction,
    Command,
    Message,
} from '../../structures/index';
import { MusicCheck } from '../../helpers/decorators/Music';


export default class CleanCommand extends Command {
    constructor(client: BotClient) {
        super(client, {
            name: 'clean',
            description: {
                content: 'Clean the bot messages',
                usage: 'clean <amount>',
                examples: ['clean 10'],
            },
            category: 'config',
            cooldown: 5,
            permissions: {
                dev: false,
                client: ['SendMessages', 'ManageMessages'],
                user: ['ManageMessages'],
            },
            args: true,
            slashCommand: true,
            options: [
                {
                    name: 'amount',
                    description: 'The amount of messages to clean',
                    type: ApplicationCommandOptionType.Integer,
                    min_value: 1,
                    max_value: 100,
                    required: true,
                },
            ],
        });
    }
    @MusicCheck({
        inVoice: false,
        sameVoice: false,
        isVote: true,
    })
    public async messageRun(message: Message, args: string[]): Promise<any> {
        let messagesToDelete = 0;
        if (args[0]) {
            messagesToDelete = parseInt(args[0]);
            if (isNaN(messagesToDelete) || messagesToDelete < 1 || messagesToDelete > 100) {
                return message.safeReply('\`❌\` Please provide a valid number between 1 and 100');
            }
        }
        let deletedMessages = 0;
        if (
            message.channel.type === ChannelType.GuildText ||
            message.channel.type === ChannelType.GuildVoice
        ) {
            const channel = message.channel as TextChannel | NewsChannel;
            await channel.messages
                .fetch({ limit: 100 })
                .then(messages => {
                    let botMessages = messages.filter(m => m.author.id === this.client.user!.id);
                    if (args[0]) {
                        botMessages = messages.filter(msg => msg.author == this.client.user);
                        botMessages.forEach(msg => {
                            if (messagesToDelete > deletedMessages) {
                                msg.delete();
                                deletedMessages++;
                            }
                        });
                        return message.safeReply(`\`✅\` Deleted ${deletedMessages} messages`);
                    } else {
                        channel.bulkDelete(botMessages);
                        return message.safeReply(`\`✅\` Deleted ${botMessages.size} messages`);
                    }
                })
                .catch(e => {
                    null;
                });
        }
    }
    @MusicCheck({
        inVoice: false,
        sameVoice: false,
        isVote: true,
    })
    public async slashRun(interaction: ChatInputCommandInteraction): Promise<any> {
        const amount = interaction.options.getInteger('amount', true);
        let deletedMessages = 0;
        if (
            interaction.channel?.type === ChannelType.GuildText ||
            interaction.channel?.type === ChannelType.GuildVoice
        ) {
            const channel = interaction.channel as TextChannel | NewsChannel;
            await channel.messages
                .fetch({ limit: 100 })
                .then(messages => {
                    let botMessages = messages.filter(m => m.author.id === this.client.user!.id);
                    botMessages.forEach(msg => {
                        if (amount > deletedMessages) {
                            msg.delete();
                            deletedMessages++;
                        }
                    });
                    return interaction.reply({
                        content: `\`✅\` Deleted ${deletedMessages} messages`,
                        ephemeral: true,
                    });
                })
                .catch(e => {
                    null;
                });
        }
    }
}
