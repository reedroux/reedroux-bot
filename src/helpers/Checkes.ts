import { PrismaClient } from '@prisma/client';
import { ChatInputCommandInteraction, Client, Guild, GuildMember, Message } from 'discord.js';
import config from '../config';

const prisma = new PrismaClient();

export async function isPremium(userId: string) {
    const premium = await prisma.premium.findFirst({ where: { userId } });
    if (premium) {
        if (premium.isPremium && premium.premiumExpiresTimestamp.getTime() > Date.now()) {
            return true;
        } else {
            await prisma.premium.delete({ where: { userId } });
        }
        return false;
    }
    return false;
}

export async function isPremiumGuild(guildId: string) {
    const premium = await prisma.premium.findFirst({ where: { guildId } });
    if (premium) {
        if (premium.isPremium && premium.premiumExpiresTimestamp.getTime() > Date.now()) {
            return true;
        } else {
            await prisma.premium.delete({ where: { userId: premium.userId } });
        }
    }
}

export async function isPremiumOrGuild(guildId: string, userId: string) {
    if (config.owners.includes(userId)) {
        return true;
    }
    const [premium, premiumGuild] = await Promise.all([
        await isPremium(userId),
        await isPremiumGuild(guildId),
    ]);
    if (premium || premiumGuild) {
        return true;
    } else {
        return false;
    }
}

export async function updatePremium(
    userId: string,
    isPremium: boolean,
    premiumType: string,
    premiumTimestamp: number,
    premiumExpiresTimestamp: number
) {
    await prisma.premium.upsert({
        where: { userId },
        update: {
            isPremium,
            premiumType,
            premiumTimestamp: new Date(premiumTimestamp),
            premiumExpiresTimestamp: new Date(premiumExpiresTimestamp),
        },
        create: {
            userId,
            isPremium,
            premiumType,
            premiumTimestamp: new Date(premiumTimestamp),
            premiumExpiresTimestamp: new Date(premiumExpiresTimestamp),
        },
    });
}

export async function isDJUser(client: Client, guildId: string, user: GuildMember) {
    const djMode = await client.db.getDj(guildId);
    const djRoles = await client.db.getDjRole(guildId);
    if (djMode && djMode.mode) {
        const roles = djRoles.map(role => role.roleId);
        if (roles.length) {
            const isDJ =
                user.roles.cache.some(role => roles.includes(role.id)) ||
                user.permissions.has('ManageGuild');
            return isDJ;
        }
        return user.permissions.has('ManageGuild');
    }
    return user.permissions.has('ManageGuild');
}

export async function isUserPremiumOrVote(userId: string) {
    if (config.owners.includes(userId)) {
        return true;
    }
    const premium = await isPremium(userId);
    if (premium) {
        return true;
    }
    const topgg = await checkVoteTopGG(userId);
    return topgg;
}

async function checkVoteTopGG(userId: any): Promise<boolean> {
    if (config.owners.includes(userId)) {
        return true;
    }
    return false;
}

export async function checkDisabledCommands(client: Client, ctx: Message | ChatInputCommandInteraction, commandName: string) {
    const disabledCommands = await client.db.getDisabledCommands(ctx.guild.id);
    if (disabledCommands && disabledCommands.length > 0) {
        const disabledCommandList = disabledCommands.map((x: any) => x.name);
        const isDj = await isDJUser(client, ctx.guild.id, ctx.member as GuildMember);
        if (!isDj && disabledCommandList.includes(commandName) && !config.owners.includes(ctx instanceof Message ? ctx.author.id : ctx.user.id) && typeof ctx.member.permissions !== 'string' &&
            !ctx.member.permissions.has('ManageGuild')) {
            return true;
        }
    }
    return false;
}