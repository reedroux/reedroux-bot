import pkg, { SignaleOptions } from 'signale';
const { Signale } = pkg;
const options: SignaleOptions = {
    disabled: false,
    interactive: false,
    logLevel: 'info',
    scope: 'bot',
};
export default class Logger extends Signale {
    constructor() {
        super({
            ...options,
            types: {
                info: {
                    badge: 'ℹ',
                    color: 'blue',
                    label: 'info',
                },
                warn: {
                    badge: '⚠',
                    color: 'yellow',
                    label: 'warn',
                },
                error: {
                    badge: '✖',
                    color: 'red',
                    label: 'error',
                },
                debug: {
                    badge: '🐛',
                    color: 'magenta',
                    label: 'debug',
                },
                success: {
                    badge: '✔',
                    color: 'green',
                    label: 'success',
                },
                log: {
                    badge: '📝',
                    color: 'white',
                    label: 'log',
                },
                pause: {
                    badge: '⏸',
                    color: 'yellow',
                    label: 'pause',
                },
                start: {
                    badge: '▶',
                    color: 'green',
                    label: 'start',
                },
                complete: {
                    badge: '🏁',
                    color: 'cyan',
                    label: 'complete',
                },
                pending: {
                    badge: '🚧',
                    color: 'yellow',
                    label: 'pending',
                },
                note: {
                    badge: '📌',
                    color: 'magenta',
                    label: 'note',
                },
                await: {
                    badge: '⏳',
                    color: 'blue',
                    label: 'await',
                },
                watch: {
                    badge: '👁',
                    color: 'blue',
                    label: 'watch',
                },
            },
        });
    }
}
