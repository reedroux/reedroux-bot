import { EmbedBuilder } from 'discord.js';
import { BotClient, Event } from '../../structures/index';

export default class ShardResume extends Event {
    constructor(client: BotClient, file: string) {
        super(client, file, {
            name: 'shardResume',
        });
    }
    public async run(id: number): Promise<any> {
        this.client.logger.info(`Shard ${id} resumed`);
        const embed = new EmbedBuilder()
            .setColor(this.client.config.colors.green)
            .setDescription(`Shard ${id} resumed`)
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
