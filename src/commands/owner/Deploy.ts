import { ActionRowBuilder, ButtonBuilder, ComponentType, ButtonStyle } from 'discord.js';
import { Command, BotClient, Message } from '../../structures/index';


export default class DeployCommand extends Command {
    constructor(client: BotClient) {
        super(client, {
            name: 'deploy',
            description: {
                content: 'Deploy the commands',
                usage: 'deploy',
                examples: ['deploy'],
            },
            aliases: ['deploycommands'],
            category: 'owner',
            cooldown: 5,
            args: false,
            permissions: {
                dev: true,
                client: [],
                user: [],
            },
            slashCommand: false,
            messageCommand: true,
        });
    }

    public async messageRun(message: Message, args: string[]): Promise<any> {
        const button = new ButtonBuilder()
            .setLabel('Global')
            .setStyle(ButtonStyle.Primary)
            .setCustomId('deploy_global');
        const button2 = new ButtonBuilder()
            .setLabel('Guild')
            .setStyle(ButtonStyle.Primary)
            .setCustomId('deploy_guild');
        const button3 = new ButtonBuilder()
            .setLabel('Stop')
            .setStyle(ButtonStyle.Danger)
            .setCustomId('deploy_stop');

        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(button, button2, button3);
        const msg = await message.reply({
            content: 'Where do you want to deploy the commands?',
            components: [row],
        });

        const filter = interaction => {
            return interaction.user.id === message.author.id;
        };

        const collector = msg.createMessageComponentCollector({
            filter,
            time: 15000,
            componentType: ComponentType.Button,
        });

        collector.on('collect', async i => {
            if (i.customId === 'deploy_global') {
                await this.client.update(i, { content: 'Started the deployment!', components: [] });
                const responce = await this.client.registerInteractions();
                if (responce) {
                    await i.editReply({ content: responce, components: [] });
                }
            } else if (i.customId === 'deploy_guild') {
                await this.client.update(i, { content: 'Started the deployment!', components: [] });
                const responce = await this.client.registerInteractions(message.guild.id);
                if (responce) {
                    await i.editReply({ content: responce, components: [] });
                }
            } else if (i.customId === 'deploy_stop') {
                await this.client.update(i, { content: 'Stopped the deployment!', components: [] });
            }
        });
    }
}
