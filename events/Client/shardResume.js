module.exports = {
  name: "shardResume",
  run: async (client, id, replayedEvents) => {
  client.logger.log(`Shard #${id} Resumed`, "log");
  }
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