const { Schema, model} = require('mongoose');

let Setup = new Schema({
    Guild : String,
    Channel: String,
    Message: String,
    voiceChannel: String,
})

module.exports = model('Setup', Setup);

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