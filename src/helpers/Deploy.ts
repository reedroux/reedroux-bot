const API_BASE = 'https://discord.com/api/v10';
const delay = (ms: number): Promise<void> => new Promise(res => setTimeout(res, ms));
import {
    ApplicationCommandType,
    PermissionsBitField,
    RESTPostAPIChatInputApplicationCommandsJSONBody,
} from 'discord.js';
import config from '../config';
import { Logger } from '../structures/index';
import Validator from './Validator';
import Utils from '../utils/Utils';

export default class Deploy {
    private data = [];
    private logger = new Logger();
    private utils = Utils;
    public constructor() {
        this.logger.info('Deploy module loaded');
    }

    public async deleteApplicationCommands(): Promise<void> {
        const route = `${API_BASE}/applications/${config.clientId}/commands`;
        try {
            const response = await fetch(route, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bot ${config.token}`,
                },
                method: 'GET',
            });
            this.logger.log('Status:', response.status);
            if (!response.ok) {
                throw new Error(`Request failed with status ${response.status}`);
            }
            const responseData = (await response.json()) as any[];
            for (const cmd of responseData) {
                const deleteRoute = `${API_BASE}/applications/${config.clientId}/commands/${cmd.id}`;
                const deleteResponse = await fetch(deleteRoute, {
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bot ${config.token}`,
                    },
                    method: 'DELETE',
                });
                this.logger.log('Status:', deleteResponse.status);
                if (!deleteResponse.ok) {
                    throw new Error(`Delete request failed with status ${deleteResponse.status}`);
                }
                await delay(5000);
                this.logger.log('Deleted', cmd.name);
            }
        } catch (error) {
            console.error(error);
        }
    }
    public async deployApplicationCommands(directory = './src/commands'): Promise<void> {
        const files = this.utils.recursiveReadDirSync(directory, ['.js', '.ts']);
        for (const file of files) {
            try {
                const cmd = require(file).default;
                const command = new cmd(this, file);
                Validator.validateCommandOptions(command);
                await this.loadCommand(command);
            } catch (ex) {
                this.logger.error(`Failed to load ${file} Reason: ${ex.message}`);
            }
        }
        this.logger.success(`Loaded ${this.data.length} commands`);
    }
    public async loadCommand(command: any): Promise<void> {
        const data: RESTPostAPIChatInputApplicationCommandsJSONBody = {
            name: command.name,
            description: command.description.content,
            type: ApplicationCommandType.ChatInput,
            options: command.options ? command.options : null,
            name_localizations: command.nameLocalizations ? command.nameLocalizations : null,
            description_localizations: command.descriptionLocalizations
                ? command.descriptionLocalizations
                : null,
            default_member_permissions:
                command.permissions.user.length > 0 ? command.permissions.user : null,
        };
        if (command.permissions.user.length > 0) {
            const permissionValue = PermissionsBitField.resolve(command.permissions.user);
            if (typeof permissionValue === 'bigint') {
                data.default_member_permissions = permissionValue.toString();
            } else {
                data.default_member_permissions = permissionValue;
            }
        }
        this.data.push(data);

        for (const cmd of this.data) {
            await delay(5000);
            this.logger.info(`Loading ${cmd.name}`);
            await this.deploy(cmd, false);
        }
    }

    public async deploy(cmd: any, dev?: boolean): Promise<void> {
        const midRoute = dev ? `/guilds/${config.guildId}` : '';
        const route = `${API_BASE}/applications/${config.clientId}${midRoute}/commands`;

        try {
            this.logger.info(`Starting update on route ${route}`);

            const existingCommand = await this.getApplicationCommands(cmd.name);
            if (existingCommand) {
                const updateRoute = `${route}/${existingCommand.id}`;
                const res = (await fetch(updateRoute, {
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bot ${config.token}`,
                    },
                    method: 'PATCH',
                    body: JSON.stringify(cmd),
                }).then(r => r.json())) as any;

                this.logger.success(res.name + ' updated');
            } else {
                const res = (await fetch(route, {
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bot ${config.token}`,
                    },
                    method: 'POST',
                    body: JSON.stringify(cmd),
                }).then(r => r.json())) as any;

                this.logger.success(res.name + ' loaded');
            }
        } catch (error) {
            console.error(error);
        }
    }

    public async getApplicationCommands(name: string): Promise<any> {
        const route = `${API_BASE}/applications/${config.clientId}/commands`;
        try {
            const response = await fetch(route, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bot ${config.token}`,
                },
                method: 'GET',
            });

            const responseData = (await response.json()) as any[];
            const command = responseData.find(cmd => cmd.name === name);
            return command;
        } catch (error) {
            console.error(error);
        }
    }

    // delete all commands
    public async deleteAllCommands(): Promise<void> {
        const route = `${API_BASE}/applications/${config.clientId}/commands`;
        try {
            const response = await fetch(route, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bot ${config.token}`,
                },
                method: 'GET',
            });
            this.logger.log('Status:', response.status);
            if (!response.ok) {
                throw new Error(`Request failed with status ${response.status}`);
            }
            const responseData = (await response.json()) as any[];
            for (const cmd of responseData) {
                const deleteRoute = `${API_BASE}/applications/${config.clientId}/commands/${cmd.id}`;
                const deleteResponse = await fetch(deleteRoute, {
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bot ${config.token}`,
                    },
                    method: 'DELETE',
                });
                this.logger.log('Status:', deleteResponse.status);
                if (!deleteResponse.ok) {
                    throw new Error(`Delete request failed with status ${deleteResponse.status}`);
                }
                await delay(5000);
                this.logger.log('Deleted', cmd.name);
            }
        } catch (error) {
            console.error(error);
        }
    }
    // delete all commands of a guild
    public async deleteAllGuildCommands(guildId?: string): Promise<void> {
        let route;
        if (!guildId) {
            route = `${API_BASE}/applications/${config.clientId}/guilds/${config.guildId}/commands`;
        } else {
            route = `${API_BASE}/applications/${config.clientId}/guilds/${guildId}/commands`;
        }
        try {
            const response = await fetch(route, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bot ${config.token}`,
                },
                method: 'GET',
            });
            this.logger.log('Status:', response.status);
            if (!response.ok) {
                throw new Error(`Request failed with status ${response.status}`);
            }
            const responseData = (await response.json()) as any[];
            for (const cmd of responseData) {
                const deleteRoute = `${API_BASE}/applications/${config.clientId}/guilds/${config.guildId}/commands/${cmd.id}`;
                const deleteResponse = await fetch(deleteRoute, {
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bot ${config.token}`,
                    },
                    method: 'DELETE',
                });
                this.logger.log('Status:', deleteResponse.status);
                if (!deleteResponse.ok) {
                    throw new Error(`Delete request failed with status ${deleteResponse.status}`);
                }
                await delay(5000);
                this.logger.log('Deleted', cmd.name);
            }
        } catch (error) {
            console.error(error);
        }
    }
}
