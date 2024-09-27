const { Schema, model} = require('mongoose');

let autoReconnect = new Schema({
    Guild : {
        type: String,
        required: true
    },
    TextId : {
        type: String,
        required: true
    },
    VoiceId : {
        type: String,
        required: true
    }, 
});
module.exports = model('autoreconnect ', autoReconnect );

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