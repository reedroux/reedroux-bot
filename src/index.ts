import { ShardingManager } from 'discord.js';
import config from './config';
import { Logger } from './structures/index';
import { handleShard } from './handlers/index';
import { ClientOptions, GatewayIntentBits, Partials } from 'discord.js';

import { BotClient } from './structures/index';

import './helpers/extenders/Guild';
import './helpers/extenders/GuildChannel';
import './helpers/extenders/Message';
import { WebHook } from './helpers/WebHook';

if (config.production) {
    const logger = new Logger();

    const manager = new ShardingManager('./dist/manager.js', {
        token: config.token,
        mode: 'process',
        totalShards: 'auto',
        shardList: 'auto',
        respawn: true,
    });

    manager.spawn().catch(err => {
        logger.error(err);
    });
    manager.on('shardCreate', shard => {
        new handleShard().shardCreate(shard, manager);
    });
} else {
    const {
        GuildMembers,
        GuildMessages,
        Guilds,
        GuildMessageTyping,
        GuildMessageReactions,
        MessageContent,
        GuildVoiceStates,
    } = GatewayIntentBits;
    const clientOptions: ClientOptions = {
        intents: [
            Guilds,
            GuildMessages,
            GuildMembers,
            GuildMessageTyping,
            GuildMessageReactions,
            MessageContent,
            GuildVoiceStates,
        ],
        allowedMentions: {
            parse: ['users', 'roles', 'everyone'],
            repliedUser: false,
        },

        partials: [
            Partials.User,
            Partials.Channel,
            Partials.GuildMember,
            Partials.Message,
            Partials.Reaction,
        ],
    };

    const client = new BotClient(clientOptions);
    client.start();

    process.on('unhandledRejection', (reason, promise) => {
        client.logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
        new WebHook(client.config.hooks.errors, "Unhandled Rejection").error(reason)
    });
    process.on('uncaughtException', err => {
        client.logger.error('Uncaught Exception thrown:', err);
        new WebHook(client.config.hooks.errors, "Uncaught Exception").error(err)
    })

    process.on("uncaughtExceptionMonitor", (error) => {
        console.error(error);
        new WebHook(client.config.hooks.errors, "UncaughtExceptionMonitor").error(error);
    });

    const handleExit = async (): Promise<void> => {
        if (client) {
            client.logger.star('Disconnecting from Discord...');
            await client.destroy();
            client.logger.success('Successfully disconnected from Discord!');
            process.exit();
        }
    };
    process.on('SIGINT', handleExit);
    process.on('SIGTERM', handleExit);
    process.on('SIGQUIT', handleExit);
}
