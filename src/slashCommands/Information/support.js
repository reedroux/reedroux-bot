const { MessageEmbed, CommandInteraction, Client } = require('discord.js');
const { MessageActionRow, MessageButton } = require('discord.js');
module.exports = {
  name: 'support',
  description: 'return websocket ping',
  userPrams: [],
  botPrams: ['EMBED_LINKS'],

  /**
   *
   * @param {Client} client
   * @param {CommandInteraction} interaction
   */

  run: async (client, interaction) => {
    await interaction.deferReply({
      ephemeral: false,
    });
    var support = client.config.links.support;
    var color = client.embedColor;
    const row = new MessageActionRow().addComponents(
      new MessageButton().setLabel('Support Server').setStyle('LINK').setURL(support),
    );
    const embed = new MessageEmbed()
      .setDescription(`Click [Here](${support}) To Join Support Server Or Click Below `)
      .setColor(color);
    await interaction.editReply({ embeds: [embed], components: [row] });
  },
};



/**
 * Project: reedroux-bot
 * Author: dawgcodes
 * Main Contributor: jan.ts
 * Company: Reedroux LLC
 * Copyright (c) 2024. All rights reserved.
 * This code is the property of Coder and may not be reproduced or
 * modified without permission. For more information, contact us at
 * https://reedroux-bot.xyz/support
 */