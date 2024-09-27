require("dotenv").config();

module.exports = {
  token: process.env.TOKEN || '', // your discord bot token
  prefix: process.env.PREFIX || '.', // bot prefix
  ownerID: process.env.OWNERID?.split(',') || ['135132310260416512','000000'], //your discord id
  SpotifyID: process.env.SPOTIFYID || '', // spotify client id
  SpotifySecret: process.env.SPOTIFYSECRET || '', // spotify client secret
  mongourl: process.env.MONGO_URI || 'mongodb+srv://', // MongoDb URL
  embedColor: process.env.COlOR || '#3366ff', // embed colour
  logs: process.env.LOGS || '', // Discord channel id 
  links: {
    support: process.env.SUPPORT || 'https://reedroux-bot.xyz/support',
    invite: process.env.INVITE || 'https://reedroux-bot.xyz/support',
    vote: process.env.VOTE || 'https://reedroux-bot.xyz/support',
    bg: process.env.BG || ''
  },

  nodes: [
    {
      url: process.env.NODE_URL || 'free.reedroux-bot.xyz',
      name: process.env.NODE_NAME || 'reedroux.biz',
      auth: process.env.NODE_AUTH || 'reedrouxfreenode',
      secure: parseBoolean(process.env.NODE_SECURE || 'false'),
    },
  ],
};

function parseBoolean(value){
    if (typeof(value) === 'string'){
        value = value.trim().toLowerCase();
    }
    switch(value){
        case true:
        case "true":
            return true;
        default:
            return false;
    }
}


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