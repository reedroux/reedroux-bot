import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, InteractionResponse } from 'discord.js';
import { BotClient, ChatInputCommandInteraction, Command, Message } from '../../structures/index';
import BotUtils from '../../utils/BotUtils';


export default class Premium extends Command {
    private response: InteractionResponse | Message;
    constructor(client: BotClient) {
        super(client, {
            name: 'premium',
            description: {
                content: 'Shows the premium information of the bot.',
                usage: 'premium',
                examples: ['premium', 'prime'],
            },
            aliases: ['prem'],
            category: 'general',
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
                    name: 'get',
                    description: 'Get premium or upgrade to premium',
                    type: 1,
                },
                {
                    name: 'status',
                    description: 'Check the status of your premium',
                    type: 1,
                }
            ],
        });
    }

    public async messageRun(message: Message, args: string[]): Promise<any> {
        const premium = await this.client.db.getPremium(message.author.id);
        const user = await this.client.db.getUser(message.author.id);
        const embed = new EmbedBuilder().setColor(this.client.config.colors.main);
        const buttoRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder().setCustomId('get_premium').setLabel('Get Premium').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('status').setLabel('Premium Status').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('cancel').setLabel('Cancel').setStyle(ButtonStyle.Danger)
        );
        const massages = [
            "Upgrade to premium for exclusive benefits and features!",
            "Unlock premium perks to enhance your experience!",
            "Elevate your status with our premium membership!",
            "Discover the advantages of becoming a premium member!",
            "Access premium content and enjoy special privileges!",
            "Take your experience to the next level with premium access!",
            "Upgrade now to enjoy premium benefits and support our service!",
            "Join our premium community for added benefits and rewards!",
            "Enhance your account with premium features tailored for you!",
            "Upgrade today and unlock a world of premium advantages!"
        ]
        const msg = massages[Math.floor(Math.random() * massages.length)];
        embed.setDescription(`**${msg}**\n\n**Benefits:**\n- Access to premium commands\n- Priority support\n- Exclusive features\n- 24/7 Uptime\n- No cooldowns\n- Custom prefix\n- And more!`);
        this.response = await message.channel.send({ embeds: [embed], components: [buttoRow] });

        const filter = (i) => i.user.id === message.author.id;
        const collector = this.response.createMessageComponentCollector({ filter, time: 60_000 });

        collector.on('collect', async (i) => {
            if (i.customId === 'get_premium') {
                const claimButton = new ButtonBuilder().setCustomId('claim').setLabel('Claim Premium').setStyle(ButtonStyle.Primary);
                const patreonButton = new ButtonBuilder().setURL(this.client.config.links.patreon).setLabel('Patreon').setStyle(ButtonStyle.Link).setEmoji({ id: "1220994440248819742" });
                const row = new ActionRowBuilder<ButtonBuilder>().addComponents(patreonButton);
                embed.setAuthor({ name: 'Get Premium', iconURL: message.author.displayAvatarURL() });
                embed.setDescription(`**You can get premium by supporting us on Patreon!** Alternatively, you can claim premium if you have credits to spend.\n- Earn credits by voting for the bot on top.gg`);
                if (user.voteCount > 0) {
                    embed.addFields([
                        { name: 'Claim Premium:', value: `You have ${user.voteCount - user.voteClaimed}$ credits to claim premium.`, inline: true },
                        { name: 'Patreon:', value: 'Support us on Patreon!', inline: true },
                    ]);
                    row.addComponents(claimButton);
                } else {
                    embed.addFields([
                        { name: 'Claim Premium:', value: 'You need credits to claim premium.', inline: true },
                        { name: 'Patreon:', value: 'Support us on Patreon!', inline: true },
                    ]);
                }
                await i.update({ embeds: [embed], components: [row] });
                embed.spliceFields(0, 2);
            } else if (i.customId === 'status') {
                if (!premium) {
                    await i.update({ embeds: [embed.setDescription('\`❌\` You do not have premium.')], components: [] });
                    return;
                }
                const status = premium ?? premium.isPremium ? 'Premium' : 'Not Premium';
                embed.setAuthor({ name: 'Premium Status', iconURL: message.author.displayAvatarURL() });
                embed.setDescription(`**Your premium status is:** \`${status}\`\n**Type:** \`${premium?.premiumType ?? 'None'}\``);
                if (premium?.isPremium) {
                    embed.addFields([
                        { name: 'Claimed:', value: `<t:${Math.floor(premium.premiumTimestamp.getTime() / 1000)}:R>`, inline: true },
                        { name: 'Expires:', value: `<t:${Math.floor(premium.premiumExpiresTimestamp.getTime() / 1000)}:R>`, inline: true },
                    ]);
                }
                await i.update({ embeds: [embed] });
                embed.spliceFields(0, 2);
            } else if (i.customId === 'claim') {
                if (user.voteCount - user.voteClaimed > 0) {
                    const shopItem = [
                        { name: 'Serene', price: 10, duration: 30 },
                        { name: 'Tranquil', price: 20, duration: 60 },
                        { name: 'Melodic', price: 30, duration: 90 },
                        { name: 'Harmonious', price: 40, duration: 120 },
                        { name: 'Symphonic', price: 50, duration: 150 },
                    ];
                    embed.setAuthor({ name: 'Claim Premium', iconURL: message.author.displayAvatarURL() });
                    embed.setDescription('**Select a premium package to claim:**');
                    embed.addFields([
                        { name: 'Serene:', value: '\`10$ - 30 days\`', inline: true },
                        { name: 'Tranquil:', value: '\`20$ - 60 days\`', inline: true },
                        { name: 'Melodic:', value: '\`30$ - 90 days\`', inline: true },
                        { name: 'Harmonious:', value: '\`40$ - 120 days\`', inline: true },
                        { name: 'Symphonic:', value: '\`50$ - 150 days\`', inline: true },
                    ]);
                    const row = new ActionRowBuilder<ButtonBuilder>();
                    shopItem.forEach((item) => {
                        row.addComponents(new ButtonBuilder().setCustomId(`claim_${item.name}`).setLabel(`${item.name} - ${item.price}$`).setStyle(ButtonStyle.Secondary));
                    });
                    await i.update({ embeds: [embed], components: [row] });
                    embed.spliceFields(0, 5);
                } else {
                    await i.update({ embeds: [embed.setDescription('\`❌\` You do not have enough credits to claim premium.')], components: [] });
                }
            } else if (i.customId === 'cancel') {
                collector.stop();
            } else if (i.customId.startsWith('claim_')) {
                const item = i.customId.split('_')[1];
                const shopItem = [
                    { name: 'Serene', price: 10, duration: 30 },
                    { name: 'Tranquil', price: 20, duration: 60 },
                    { name: 'Melodic', price: 30, duration: 90 },
                    { name: 'Harmonious', price: 40, duration: 120 },
                    { name: 'Symphonic', price: 50, duration: 150 },
                ];
                const selectedItem = shopItem.find((i) => i.name === item);
                if (selectedItem) {
                    if (user.voteCount - user.voteClaimed >= selectedItem.price) {
                        await this.client.db.updateUser({
                            userId: message.author.id,
                            voteClaimed: user.voteClaimed + selectedItem.price,
                        })
                        await this.client.db.updatePremium({
                            userId: message.author.id,
                            premiumType: item,
                            isPremium: true,
                            premiumTimestamp: new Date(),
                            premiumExpiresTimestamp: new Date(Date.now() + selectedItem.duration * 24 * 60 * 60 * 1000),
                        })
                        await i.update({ embeds: [embed.setDescription(`\`✅\` You have successfully claimed the premium package: \`${item}\``)], components: [] });
                    } else {
                        await i.update({ embeds: [embed.setDescription('\`❌\` You do not have enough credits to claim this premium package.')], components: [] });
                    }
                }
            }
        });

        collector.on('end', async () => {
            if (this.response instanceof Message && this.response.editable) {
                await BotUtils.handleCollectorEnd(this.response).catch(() => { });
            }
        });
    }

    public async slashRun(interaction: ChatInputCommandInteraction): Promise<any> {
        const premium = await this.client.db.getPremium(interaction.user.id);
        const user = await this.client.db.getUser(interaction.user.id);

        const embed = new EmbedBuilder().setColor(this.client.config.colors.main);

        const subCommand = interaction.options.getSubcommand();

        if (subCommand === 'get') {
            const claimButton = new ButtonBuilder().setCustomId('claim').setLabel('Claim Premium').setStyle(ButtonStyle.Primary);
            const patreonButton = new ButtonBuilder().setURL(this.client.config.links.patreon).setLabel('Patreon').setStyle(ButtonStyle.Link);
            const row = new ActionRowBuilder<ButtonBuilder>().addComponents(patreonButton);
            embed.setAuthor({ name: 'Get Premium', iconURL: interaction.user.displayAvatarURL() });
            embed.setDescription(`**You can get premium by supporting us on Patreon!** Alternatively, you can claim premium if you have credits to spend.\n- Earn credits by voting for the bot on top.gg`);
            if (user.voteCount > 0) {
                embed.addFields([
                    { name: 'Claim Premium:', value: `You have ${user.voteCount - user.voteClaimed}$ credits to claim premium.`, inline: true },
                    { name: 'Patreon:', value: 'Support us on Patreon!', inline: true },
                ]);
                row.addComponents(claimButton);
            } else {
                embed.addFields([
                    { name: 'Claim Premium:', value: 'You need credits to claim premium.', inline: true },
                    { name: 'Patreon:', value: 'Support us on Patreon!', inline: true },
                ]);
            }
            this.response = await interaction.reply({ embeds: [embed], components: [row] });
            embed.spliceFields(0, 2);
        } else if (subCommand === 'status') {
            if (!premium) {
                await interaction.reply({ embeds: [embed.setDescription('\`❌\` You do not have premium.')], components: [] });
                return;
            }
            const status = premium ?? premium.isPremium ? 'Premium' : 'Not Premium';
            embed.setAuthor({ name: 'Premium Status', iconURL: interaction.user.displayAvatarURL() });
            embed.setDescription(`**Your premium status is:** \`${status}\`\n**Type:** \`${premium?.premiumType ?? 'None'}\``);
            if (premium?.isPremium) {
                embed.addFields([
                    { name: 'Claimed:', value: `<t:${Math.floor(premium.premiumTimestamp.getTime() / 1000)}:R>`, inline: true },
                    { name: 'Expires:', value: `<t:${Math.floor(premium.premiumExpiresTimestamp.getTime() / 1000)}:R>`, inline: true },
                ]);
            }
            await interaction.reply({ embeds: [embed] });
            embed.spliceFields(0, 2);
        }

        const filter = (i) => i.user.id === interaction.user.id;
        const collector = this.response.createMessageComponentCollector({ filter, time: 60_000 });

        collector.on('collect', async (i) => {
            if (i.customId === 'claim') {
                if (user.voteCount - user.voteClaimed > 0) {
                    const shopItem = [
                        { name: 'Serene', price: 10, duration: 30 },
                        { name: 'Tranquil', price: 20, duration: 60 },
                        { name: 'Melodic', price: 30, duration: 90 },
                        { name: 'Harmonious', price: 40, duration: 120 },
                        { name: 'Symphonic', price: 50, duration: 150 },
                    ];
                    embed.setAuthor({ name: 'Claim Premium', iconURL: interaction.user.displayAvatarURL() });
                    embed.setDescription('**Select a premium package to claim:**');
                    embed.addFields([
                        { name: 'Serene:', value: '\`10$ - 30 days\`', inline: true },
                        { name: 'Tranquil:', value: '\`20$ - 60 days\`', inline: true },
                        { name: 'Melodic:', value: '\`30$ - 90 days\`', inline: true },
                        { name: 'Harmonious:', value: '\`40$ - 120 days\`', inline: true },
                        { name: 'Symphonic:', value: '\`50$ - 150 days\`', inline: true },
                    ]);
                    const row = new ActionRowBuilder<ButtonBuilder>();
                    shopItem.forEach((item) => {
                        row.addComponents(new ButtonBuilder().setCustomId(`claim_${item.name}`).setLabel(`${item.name} - ${item.price}$`).setStyle(ButtonStyle.Secondary));
                    });
                    await i.update({ embeds: [embed], components: [row] });
                    embed.spliceFields(0, 5);
                } else {
                    await i.update({ embeds: [embed.setDescription('\`❌\` You do not have enough credits to claim premium.')], components: [] });
                }
            } else if (i.customId.startsWith('claim_')) {
                const item = i.customId.split('_')[1];
                const shopItem = [
                    { name: 'Serene', price: 10, duration: 30 },
                    { name: 'Tranquil', price: 20, duration: 60 },
                    { name: 'Melodic', price: 30, duration: 90 },
                    { name: 'Harmonious', price: 40, duration: 120 },
                    { name: 'Symphonic', price: 50, duration: 150 },
                ];
                const selectedItem = shopItem.find((i) => i.name === item);
                if (selectedItem) {
                    if (user.voteCount - user.voteClaimed >= selectedItem.price) {
                        await this.client.db.updateUser({
                            userId: interaction.user.id,
                            voteClaimed: user.voteClaimed + selectedItem.price,
                        })
                        await this.client.db.updatePremium({
                            userId: interaction.user.id,
                            premiumType: item,
                            isPremium: true,
                            premiumTimestamp: new Date(),
                            premiumExpiresTimestamp: new Date(Date.now() + selectedItem.duration * 24 * 60 * 60 * 1000),
                        })
                        await i.update({ embeds: [embed.setDescription(`\`✅\` You have successfully claimed the premium package: \`${item}\``)], components: [] });
                    } else {
                        await i.update({ embeds: [embed.setDescription('\`❌\` You do not have enough credits to claim this premium package.')], components: [] });
                    }
                }
            }
        });

        collector.on('end', async () => {
            await this.response.edit({ components: [] }).catch(() => null);
        });
    }
}
