import {
    guilds,
    PrismaClient,
    user,
    playlist,
    premium,
    botChannels,
    trackButton,
    voiceChannels,
    defaultVolume,
    announce,
    disabledCommands,
    stay247,
    Dj,
    DjRole,
    Prisma,
    Command,
    track,
    channelStatus,
    lastFm,
} from '@prisma/client';
import config from '../../config';

export class Database {
    private prisma = new PrismaClient();
    // get guild
    public async getGuild(guildId: string): Promise<guilds | null> {
        const guild = await this.prisma.guilds.findFirst({
            where: { guildId },
        });
        if (!guild) {
            return await this.createGuild(guildId);
        }
        return guild;
    }
    // create guild
    public async createGuild(guildId: string): Promise<guilds> {
        let guild = await this.prisma.guilds.findUnique({
            where: { guildId },
        });
        if (!guild) {
            try {
                guild = await this.prisma.guilds.create({
                    data: {
                        guildId,
                        prefix: config.prefix,
                    },
                });
            } catch (error) {
                // Handle unique constraint violation
                if (error.code === 'P2002') {
                    // If a guild with the same guildId already exists,
                    // you can choose to update it instead of creating a new one
                    guild = await this.prisma.guilds.update({
                        where: { guildId },
                        data: { prefix: config.prefix }, // Update prefix or any other field as needed
                    });
                } else {
                    throw error; // Re-throw any other error
                }
            }
        }
        return guild;
    }
    // update guild
    public async updateGuild(data: guilds): Promise<guilds> {
        return await this.prisma.guilds.upsert({
            where: { guildId: data.guildId },
            update: data,
            create: { guildId: data.guildId, ...data },
        });
    }
    // get user
    public async getUser(userId: string): Promise<user | null> {
        const user = await this.prisma.user.findFirst({
            where: { userId },
        });
        if (!user) {
            return await this.createUser(userId);
        }
        return user;
    }
    // create user
    public async createUser(userId: string): Promise<user> {
        const user = await this.prisma.user.findUnique({
            where: { userId },
        });
        if (!user) {
            return await this.prisma.user.create({
                data: {
                    userId,
                },
            });
        }
        return user;
    }

    // update user
    public async updateUser(data: Partial<user>): Promise<user> {
        return await this.prisma.user.upsert({
            where: { userId: data.userId },
            update: data,
            create: { userId: data.userId, ...data },
        });
    }

    //
    public async isPremium(userId: string): Promise<boolean> {
        const premium = await this.prisma.premium.findFirst({ where: { userId } });
        if (premium) {
            if (premium.isPremium && premium.premiumExpiresTimestamp.getTime() > Date.now()) {
                return true;
            } else {
                await this.prisma.premium.delete({ where: { userId } });
            }
            return false;
        }
        return false;
    }

    // get prefix
    public async getPrefix(guildId: string): Promise<string> {
        const guild = await this.getGuild(guildId);
        if (!guild) return config.prefix;
        return guild.prefix;
    }

    // get default volume
    public async getDefaultVolume(guildId: string): Promise<defaultVolume | null> {
        return await this.prisma.defaultVolume.findFirst({
            where: { guildId },
        });
    }

    // update default volume
    public async updateDefaultVolume(data: Partial<defaultVolume>): Promise<defaultVolume> {
        return await this.prisma.defaultVolume.upsert({
            where: { guildId: data.guildId },
            update: data,
            create: { guildId: data.guildId, ...data },
        });
    }

    // get premium
    public async getPremium(userId: string): Promise<premium | null> {
        return await this.prisma.premium.findFirst({
            where: { userId },
        });
    }

    // update premium
    public async updatePremium(data: Partial<premium>): Promise<premium> {
        return await this.prisma.premium.upsert({
            where: { userId: data.userId },
            update: data,
            create: { userId: data.userId, ...data } as unknown as Prisma.premiumCreateInput,
        });
    }

    // get playlists
    public async getPlaylists(userId: string): Promise<playlist[]> {
        return await this.prisma.playlist.findMany({
            where: { userId },
        });
    }
    // get playlist by playlistId
    public async getPlaylist(playlistId: string): Promise<playlist | null> {
        return await this.prisma.playlist.findFirst({
            where: { playlistId },
        });
    }
    // create playlist
    public async createPlaylist(data: Partial<playlist>): Promise<playlist> {
        return await this.prisma.playlist.create({
            data: data as Prisma.playlistCreateInput,
        });
    }
    // update playlist
    public async updatePlaylist(data: Partial<playlist>): Promise<playlist> {
        return await this.prisma.playlist.upsert({
            where: { playlistId: data.playlistId },
            update: data,
            create: { playlistId: data.playlistId, ...data } as unknown as Prisma.playlistCreateInput,
        });
    }

    // delete playlist
    public async deletePlaylist(playlistId: string): Promise<playlist> {
        return await this.prisma.playlist.delete({
            where: { playlistId },
        });
    }

    // get bot channels
    public async getBotChannels(guildId: string): Promise<botChannels[]> {
        return await this.prisma.botChannels.findMany({
            where: { guildId },
        });
    }

    // update bot channels
    public async updateBotChannels(
        guildId: string,
        channels: Array<{ channelId: string }>,
        moderatorId: string
    ): Promise<void> {
        const data = await this.prisma.botChannels.findMany({
            where: { guildId },
        });

        const existingChannelsMap = new Map(data.map(channel => [channel.channelId, channel]));

        const toDelete = data.filter(
            channel => !channels.find(c => c.channelId === channel.channelId)
        );
        const toCreate = channels.filter(channel => !existingChannelsMap.has(channel.channelId));
        const toUpdate = channels.filter(channel => existingChannelsMap.has(channel.channelId));

        if (toDelete.length > 0) {
            await this.prisma.botChannels.deleteMany({
                where: {
                    guildId,
                    channelId: {
                        in: toDelete.map(channel => channel.channelId),
                    },
                },
            });
        }

        if (toCreate.length > 0) {
            await Promise.all(
                toCreate.map(channel =>
                    this.prisma.botChannels.create({
                        data: {
                            guildId,
                            channelId: channel.channelId,
                            moderatorId,
                        },
                    })
                )
            );
        }

        if (toUpdate.length > 0) {
            await Promise.all(
                toUpdate.map(channel =>
                    this.prisma.botChannels.update({
                        where: {
                            id: existingChannelsMap.get(channel.channelId).id,
                            guildId: guildId,
                        },
                        data: {
                            guildId,
                            moderatorId,
                            channelId: channel.channelId,
                        },
                    })
                )
            );
        }
    }

    // delete bot channels
    public async deleteBotChannel(guildId: string, channelId: string): Promise<botChannels> {
        const data = await this.prisma.botChannels.findFirst({
            where: { guildId, channelId },
        });
        if (!data) return null;
        return await this.prisma.botChannels.delete({
            where: { id: data.id },
        });
    }

    // clear bot channels
    public async clearBotChannels(guildId: string): Promise<void> {
        await this.prisma.botChannels.deleteMany({
            where: { guildId },
        });
    }
    // get voice channels
    public async getVoiceChannels(guildId: string): Promise<voiceChannels[]> {
        return await this.prisma.voiceChannels.findMany({
            where: { guildId },
        });
    }

    // update voice channels
    public async updateVoiceChannels(
        guildId: string,
        channels: Array<{ channelId: string }>,
        moderatorId: string
    ): Promise<void> {
        const data = await this.prisma.voiceChannels.findMany({
            where: { guildId },
        });

        const existingChannelsMap = new Map(data.map(channel => [channel.channelId, channel]));

        const toDelete = data.filter(
            channel => !channels.find(c => c.channelId === channel.channelId)
        );
        const toCreate = channels.filter(channel => !existingChannelsMap.has(channel.channelId));
        const toUpdate = channels.filter(channel => existingChannelsMap.has(channel.channelId));

        if (toDelete.length > 0) {
            await this.prisma.voiceChannels.deleteMany({
                where: {
                    guildId,
                    channelId: {
                        in: toDelete.map(channel => channel.channelId),
                    },
                },
            });
        }

        if (toCreate.length > 0) {
            await Promise.all(
                toCreate.map(channel =>
                    this.prisma.voiceChannels.create({
                        data: {
                            guildId,
                            channelId: channel.channelId,
                            moderatorId,
                        },
                    })
                )
            );
        }

        if (toUpdate.length > 0) {
            await Promise.all(
                toUpdate.map(channel =>
                    this.prisma.voiceChannels.update({
                        where: {
                            id: existingChannelsMap.get(channel.channelId).id,
                            guildId: guildId,
                        },
                        data: {
                            guildId,
                            moderatorId,
                            channelId: channel.channelId,
                        },
                    })
                )
            );
        }
    }

    // delete voice channels
    public async deleteVoiceChannel(guildId: string, channelId: string): Promise<voiceChannels> {
        const data = await this.prisma.voiceChannels.findFirst({
            where: { guildId, channelId },
        });
        if (!data) return null;
        return await this.prisma.voiceChannels.delete({
            where: { id: data.id },
        });
    }

    // clear voice channels
    public async clearVoiceChannels(guildId: string): Promise<void> {
        await this.prisma.voiceChannels.deleteMany({
            where: { guildId },
        });
    }
    // get disabled commands
    public async getDisabledCommands(guildId: string): Promise<disabledCommands[]> {
        return await this.prisma.disabledCommands.findMany({
            where: { guildId },
        });
    }

    // create disabled commands
    public async createDisabledCommands(
        data: Partial<disabledCommands>
    ): Promise<disabledCommands> {
        return await this.prisma.disabledCommands.create({
            data: data as Prisma.disabledCommandsCreateInput,
        });
    }

    // remove disabled command
    public async removeDisabledCommand(guildId: string, name: string): Promise<disabledCommands> {
        const data = await this.prisma.disabledCommands.findFirst({
            where: { guildId, name },
        });
        if (!data) return null;
        return await this.prisma.disabledCommands.delete({
            where: { id: data.id },
        });
    }

    // clear disabled commands
    public async clearDisabledCommands(guildId: string): Promise<any> {
        return await this.prisma.disabledCommands.deleteMany({
            where: { guildId },
        });
    }

    // get stay247
    public async get247(guildId: string): Promise<stay247 | null> {
        return await this.prisma.stay247.findFirst({
            where: { guildId },
        });
    }

    // get all 247
    public async getAll247(): Promise<stay247[]> {
        return await this.prisma.stay247.findMany({ where: { mode: true } });
    }

    // update stay247
    public async update247(data: Partial<stay247>): Promise<stay247> {
        return await this.prisma.stay247.upsert({
            where: { guildId: data.guildId },
            update: data,
            create: { guildId: data.guildId, ...data },
        });
    }

    // get announce
    public async getAnnounce(guildId: string): Promise<announce | null> {
        const announce = await this.prisma.announce.findFirst({
            where: { guildId },
        });
        if (!announce) return null;
        return announce;
    }
    // update announce
    public async updateAnnounce(data: Partial<announce>): Promise<announce> {
        return await this.prisma.announce.upsert({
            where: {
                guildId: data.guildId,
            },
            update: data,
            create: { guildId: data.guildId, ...data } as unknown as Prisma.announceCreateInput,
        });
    }

    // delete announce
    public async deleteAnnounce(guildId: string): Promise<announce> {
        return await this.prisma.announce.delete({
            where: { guildId },
        });
    }

    // get Dj
    public async getDj(guildId: string): Promise<Dj | null> {
        return await this.prisma.dj.findFirst({
            where: { guildId },
        });
    }

    // update Dj
    public async updateDj(data: Partial<Dj>): Promise<Dj> {
        return await this.prisma.dj.upsert({
            where: { guildId: data.guildId },
            update: data,
            create: { guildId: data.guildId, ...data },
        });
    }

    // get Dj Role
    public async getDjRole(guildId: string): Promise<DjRole[]> {
        return await this.prisma.djRole.findMany({
            where: { guildId },
        });
    }

    // update Dj Role
    public async updateDjRole(
        guildId: string,
        roles: Array<{ roleId: string }>,
        moderatorId: string
    ): Promise<void> {
        const data = await this.prisma.djRole.findMany({
            where: { guildId },
        });

        const existingRolesMap = new Map(data.map(role => [role.roleId, role]));

        const toDelete = data.filter(role => !roles.find(r => r.roleId === role.roleId));
        const toCreate = roles.filter(role => !existingRolesMap.has(role.roleId));
        const toUpdate = roles.filter(role => existingRolesMap.has(role.roleId));

        if (toDelete.length > 0) {
            await this.prisma.djRole.deleteMany({
                where: {
                    guildId,
                    roleId: {
                        in: toDelete.map(role => role.roleId),
                    },
                },
            });
        }

        if (toCreate.length > 0) {
            await Promise.all(
                toCreate.map(role =>
                    this.prisma.djRole.create({
                        data: {
                            guildId,
                            roleId: role.roleId,
                            moderatorId,
                        },
                    })
                )
            );
        }

        if (toUpdate.length > 0) {
            await Promise.all(
                toUpdate.map(role =>
                    this.prisma.djRole.update({
                        where: {
                            id: existingRolesMap.get(role.roleId).id,
                            guildId: guildId,
                        },
                        data: {
                            guildId,
                            moderatorId,
                            roleId: role.roleId,
                        },
                    })
                )
            );
        }
    }

    // delete Dj Role
    public async deleteDjRole(guildId: string, roleId: string): Promise<DjRole> {
        const data = await this.prisma.djRole.findFirst({
            where: { guildId, roleId },
        });
        if (!data) return null;
        return await this.prisma.djRole.delete({
            where: { id: data.id },
        });
    }

    // clear Dj Role
    public async clearDjRoles(guildId: string): Promise<void> {
        await this.prisma.djRole.deleteMany({
            where: { guildId },
        });
    }
    // get track button
    public async getTrackButton(guildId: string): Promise<trackButton | null> {
        return await this.prisma.trackButton.findFirst({
            where: { guildId },
        });
    }

    // update track button
    public async updateTrackButton(data: Partial<trackButton>): Promise<trackButton> {
        return await this.prisma.trackButton.upsert({
            where: {
                guildId: data.guildId,
            },
            update: data,
            create: { guildId: data.guildId, ...data },
        });
    }

    // delete track button
    public async deleteTrackButton(guildId: string): Promise<trackButton> {
        return await this.prisma.trackButton.delete({
            where: { guildId },
        });
    }

    // get channel status
    public async getChannelStatus(guildId: string): Promise<channelStatus> {
        return await this.prisma.channelStatus.findFirst({
            where: { guildId },
        });
    }

    // update channel status
    public async updateChannelStatus(data: Partial<channelStatus>): Promise<channelStatus> {
        return await this.prisma.channelStatus.upsert({
            where: {
                guildId: data.guildId,
            },
            update: data,
            create: { guildId: data.guildId, ...data },
        });
    }
    // delete all settings
    public async resetSettings(guildId: string): Promise<void> {
        await Promise.all([
            this.prisma.guilds.delete({ where: { guildId } }),
            this.prisma.defaultVolume.deleteMany({ where: { guildId } }),
            this.prisma.botChannels.deleteMany({ where: { guildId } }),
            this.prisma.voiceChannels.deleteMany({ where: { guildId } }),
            this.prisma.disabledCommands.deleteMany({ where: { guildId } }),
            this.prisma.stay247.deleteMany({ where: { guildId } }),
            this.prisma.announce.deleteMany({ where: { guildId } }),
            this.prisma.dj.deleteMany({ where: { guildId } }),
            this.prisma.djRole.deleteMany({ where: { guildId } }),
            this.prisma.trackButton.deleteMany({ where: { guildId } }),
            this.prisma.channelStatus.deleteMany({ where: { guildId } }),
        ]).catch(() => { })
    }

    // gt all data by guildId
    public async getAllData(guildId: string): Promise<
        guilds & {
            botChannels: botChannels[];
            voiceChannels: voiceChannels[];
            disabledCommands: disabledCommands[];
            stay247: stay247 | null;
            announce: announce | null;
            Dj: Dj | null;
            DjRole: DjRole[];
            trackButton: trackButton | null;
            channelStatus: channelStatus
        }
    > {
        const [
            guild,
            botChannels,
            voiceChannels,
            disabledCommands,
            stay247,
            announce,
            Dj,
            DjRole,
            trackButton,
            channelStatus,
        ] = await Promise.all([
            this.getGuild(guildId),
            this.getBotChannels(guildId),
            this.getVoiceChannels(guildId),
            this.getDisabledCommands(guildId),
            this.get247(guildId),
            this.getAnnounce(guildId),
            this.getDj(guildId),
            this.getDjRole(guildId),
            this.getTrackButton(guildId),
            this.getChannelStatus(guildId),
        ]);
        return {
            ...guild,
            botChannels,
            voiceChannels,
            disabledCommands,
            stay247,
            announce,
            Dj,
            DjRole,
            trackButton,
            channelStatus,
        };
    }
    // get most used commands
    public async getMostUsedCommands(): Promise<Command[]> {
        return await this.prisma.command.findMany({
            orderBy: {
                used: 'desc',
            },
            take: 10,
        });
    }

    // get total commands used
    public async getTotalCommandsUsed(): Promise<number> {
        return await this.prisma.command.aggregate({
            _sum: {
                used: true,
            },
        }).then(res => Number(res._sum.used));
    }

    // update command usage if exists, else create
    public async updateCommandUsage(name: string): Promise<Command> {
        const command = await this.prisma.command.findFirst({
            where: { name },
        });
        if (command) {
            return await this.prisma.command.update({
                where: { name },
                data: {
                    used: command.used + 1n,
                },
            });
        }
        return await this.prisma.command.create({
            data: {
                name,
                used: 1,
            },
        });
    }

    // get most used tracks
    public async getMostUsedTracks(): Promise<track[]> {
        return await this.prisma.track.findMany({
            orderBy: {
                used: 'desc',
            },
            take: 10,
        });
    }

    // get total tracks used
    public async getTotalTracksUsed(): Promise<number> {
        return await this.prisma.track.aggregate({
            _sum: {
                used: true,
            },
        }).then(res => Number(res._sum.used));
    }
    // update track usage if exists, else create
    public async updateTrackUsage(encoded: string): Promise<track> {
        const track = await this.prisma.track.findFirst({
            where: { encoded },
        });
        if (track) {
            return await this.prisma.track.update({
                where: { encoded },
                data: {
                    used: track.used + 1n,
                },
            });
        }
        return await this.prisma.track.create({
            data: {
                encoded,
                used: 1,
            },
        });
    }

    public async updateLastFm(data: Partial<lastFm>): Promise<lastFm> {
        const user = await this.prisma.user.findFirst({
            where: { userId: data.userId },
        });
        if (!user) {
            await this.prisma.user.create({
                data: {
                    userId: data.userId,
                },
            });
        }
        return await this.prisma.lastFm.upsert({
            where: { userId: data.userId },
            update: data,
            create: { userId: data.userId, ...data } as unknown as Prisma.lastFmCreateInput,
        });
    }

    // get lastfm
    public async getLastFm(userId: string): Promise<lastFm | null> {
        return await this.prisma.lastFm.findFirst({
            where: { userId },
        });
    }

    // delete lastfm
    public async deleteLastFm(userId: string): Promise<lastFm> {
        return await this.prisma.lastFm.delete({
            where: { userId },
        });
    }
}
