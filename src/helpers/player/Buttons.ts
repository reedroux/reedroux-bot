import config from '../../config';
import { ButtonBuilder } from 'discord.js';
import { Dispatcher } from '../../structures/music/Dispatcher';

function createButton(
    customId: string,
    label: string,
    style: number,
    emoji?: string,
    disabled?: boolean
) {
    const button = new ButtonBuilder().setCustomId(customId).setStyle(style);

    if (emoji) button.setEmoji(emoji);
    if (label) button.setLabel(label);
    if (disabled) button.setDisabled(disabled);
    return button;
}

export function trackButton(player: Dispatcher) {
    return {
        previous: createButton(
            'PREVIOUS',
            '',
            2,
            config.bemoji.previous,
            player ? !player.previousTracks.length : true
        ),
        play: createButton(
            'PLAY',
            player ? (player.paused ? '' : '') : '',
            player ? (player.paused ? 3 : 2) : 2,
            player
                ? player.paused
                    ? config.bemoji.play
                    : config.bemoji.pause
                : config.bemoji.play,
            false
        ),
        skip: createButton('SKIP', '', 2, config.bemoji.skip, false),
        like: createButton('LIKE', '', 3, config.bemoji.like, false),
        stop: createButton('STOP', '', 4, config.bemoji.stop, false),
        volUp: createButton('VOL_UP', '', 2, config.bemoji.volUp, player ? player.volume === 100 : false),
        volDown: createButton('VOL_DOWN', '', 2, config.bemoji.volDown, player ? player.volume === 0 : false),
        queue: createButton('QUEUE', '', 2, config.bemoji.queue, player ? !player.queue.length : false),
        loop: createButton('LOOP', '', 2, config.bemoji.loop, false),
        shuffle: createButton('SHUFFLE', '', 2, config.bemoji.shuffle, false),
    };
}
