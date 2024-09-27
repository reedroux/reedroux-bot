const { MessageEmbed, CommandInteraction, Client } = require('discord.js');

module.exports = {
  name: 'ping',
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
    await interaction.editReply({ content: 'Pining...' }).then(async () => {
      const ping = Date.now() - interaction.createdAt;
      const api_ping = client.ws.ping;

      await interaction.editReply({
        content: ' ',
        embeds: [
          new MessageEmbed()
            .setColor(client.embedColor)
            .setDescription(
              `\`\`\`ini\n[ Bot Latency ] :: ${ping}ms \n[ API Latency ] :: ${api_ping}ms \`\`\``,
            ),
        ],
      });
    });
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