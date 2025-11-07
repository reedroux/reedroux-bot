import { Shard, ShardingManager } from 'discord.js';
import { Logger } from '../structures/index';

export default class handleShard {
    private logger = new Logger();
    // shard, manager
    public async shardCreate(shard: Shard, manager: ShardingManager): Promise<any> {
        this.logger.info(`Shard #${shard.id} has started`);
        shard.on('message', message => {
            this.shardMessage(shard, message, manager);
        });
    }
    public async shardMessage(
        originShard: Shard,
        message: any,
        manager: ShardingManager
    ): Promise<any> {
        this.logger.info(`Shard #${originShard.id} has sent a message`);

        if (!originShard || !message) return;
        switch (message.type) {
            case 'shutdown':
                switch (message.shard) {
                    case 'all':
                        this.logger.warn('Shutting down all shards');
                        for (const shard of manager.shards.values()) {
                            shard.kill();
                            process.exit();
                        }
                        break;
                    default:
                        this.logger.warn('Shutting down shard %d', message.shard);
                        // eslint-disable-next-line no-case-declarations
                        const shard = manager.shards.get(message.shard);
                        if (shard) shard.kill();
                        break;
                }
                break;
            case 'reboot':
                switch (message.shard) {
                    case 'all':
                        this.logger.warn('Rebooting all shards');
                        for (const shard of manager.shards.values()) {
                            shard.respawn();
                        }
                        break;
                    default:
                        this.logger.warn('Rebooting shard %d', message.shard);
                        // eslint-disable-next-line no-case-declarations
                        const shard = manager.shards.get(message.shard);
                        if (shard) shard.respawn();
                        break;
                }
                break;
            default:
                //this.logger.warn('Unknown message type %s', message.type);
                break;
        }
    }
}
