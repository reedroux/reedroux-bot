import { EmbedBuilder } from 'discord.js';
import { BotClient, Event } from '../../structures/index';

export default class ShardDisconnect extends Event {
    constructor(client: BotClient, file: string) {
        super(client, file, {
            name: 'shardDisconnect',
        });
    }
    public async run(id: number): Promise<any> {
        this.client.logger.warn(`Shard ${id} disconnected`);
        const embed = new EmbedBuilder()
            .setColor(this.client.config.colors.red)
            .setDescription(`Shard ${id} disconnected`)
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
