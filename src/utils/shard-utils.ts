import { fetchRecommendedShardCount, ShardClientUtil, ShardingManager } from 'discord.js';
import { DiscordLimits } from './discord-limits';
import { MathUtils } from './math-utils';


export class ShardUtils {
    public static async requiredShardCount(token: string): Promise<number> {
        return await this.recommendedShardCount(token, DiscordLimits.GUILDS_PER_SHARD);
    }

    public static async recommendedShardCount(
        token: string,
        serversPerShard: number
    ): Promise<number> {
        return Math.ceil(
            await fetchRecommendedShardCount(token, { guildsPerShard: serversPerShard })
        );
    }

    public static shardIds(shardInterface: ShardingManager | ShardClientUtil): number[] {
        if (shardInterface instanceof ShardingManager) {
            return shardInterface.shards.map(shard => shard.id);
        } else if (shardInterface instanceof ShardClientUtil) {
            return shardInterface.ids;
        }
    }

    public static shardId(guildId: number | string, shardCount: number): number {
        // See sharding formula:
        //   https://discord.com/developers/docs/topics/gateway#sharding-sharding-formula
        // tslint:disable-next-line:no-bitwise
        return Number((BigInt(guildId) >> 22n) % BigInt(shardCount));
    }

    public static async serverCount(
        shardInterface: ShardingManager | ShardClientUtil
    ): Promise<number> {
        let shardGuildCounts = (await shardInterface.fetchClientValues(
            'guilds.cache.size'
        )) as number[];
        return MathUtils.sum(shardGuildCounts);
    }

    public static async userCount(
        shardInterface: ShardingManager | ShardClientUtil
    ): Promise<number> {
        let shardUserCounts = (await shardInterface.broadcastEval(c => c.guilds.cache.reduce((prev, guild) => prev + guild.memberCount, 0))) as number[];
        return MathUtils.sum(shardUserCounts);
    }

    public static async ping(
        shardInterface: ShardingManager | ShardClientUtil
    ): Promise<number> {
        let shardPings = (await shardInterface.broadcastEval(c => c.ws.ping)) as number[];
        return MathUtils.average(shardPings);
    }

    // get the shard info by guild id
    public static async shardInfo(
        shardInterface: ShardingManager | ShardClientUtil,
        guildId: string,
        totalShards: number
    ): Promise<any> {
        let shardId = this.shardId(guildId, totalShards);
        let shardInfo = (await shardInterface.broadcastEval(c => ({
            id: c.shard.ids,
            shards: c.shard.count,
            status: c.shard.client.ws.status,
            guilds: c.guilds.cache.size,
            channels: c.channels.cache.size,
            members: c.guilds.cache.map(g => g.memberCount),
            memoryUsage: (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2),
            ramUsage: (process.memoryUsage().rss / 1024 / 1024).toFixed(2),
            ping: c.ws.ping,
        }))) as any[];
        return shardInfo[shardId];
    }
}