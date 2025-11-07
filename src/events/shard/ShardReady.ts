import { EmbedBuilder } from 'discord.js';
import { BotClient, Event } from '../../structures/index';

export default class ShardReady extends Event {
    constructor(client: BotClient, file: string) {
        super(client, file, {
            name: 'shardReady',
        });
    }
    public async run(id: number): Promise<any> {
        this.client.logger.complete(`Shard ${id} ready`);
        const embed = new EmbedBuilder()
            .setColor(this.client.config.colors.green)
            .setDescription(`Shard ${id} is ready!`)
            .setTimestamp();
        await fetch(this.client.config.hooks.shard, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                embeds: [embed],
            }),
        });
    }
}
