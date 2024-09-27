const { Schema, model } = require("mongoose");

const Playlist = new Schema({
    Username: {
        type: String,
        required: false
    },
    UserId: {
        type: String,
        required: true
    },
    PlaylistName: {
        type: String,
        required: true
    },
    Playlist: {
        type: Array,
        required: true
    },
    CreatedOn: {
        type: Number,
        required: true
    }

});

module.exports = model('playlist', Playlist);



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