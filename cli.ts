import { REST, Routes, ApplicationCommandDataResolvable } from 'discord.js';
import config from '../../config';
import commands from '../commands';

export default class Deploy {
    private rest: REST;

    constructor() {
        this.rest = new REST({ version: '10' }).setToken(config.token);
    }

    async deployApplicationCommands() {
        try {
            console.log('Deploying application commands...');

            await this.rest.put(
                Routes.applicationCommands(config.clientId),
                { body: commands as ApplicationCommandDataResolvable[] }
            );

            console.log('✅ Successfully deployed application commands.');
        } catch (error) {
            console.error('❌ Error deploying application commands:', error);
        }
    }

    async deleteAllCommands() {
        try {
            console.log('Deleting all global application commands...');

            await this.rest.put(
                Routes.applicationCommands(config.clientId),
                { body: [] }
            );

            console.log('✅ All global application commands deleted.');
        } catch (error) {
            console.error('❌ Error deleting commands:', error);
        }
    }

    async deleteAllGuildCommands(guildId: string) {
        try {
            console.log(`Deleting commands for guild ${guildId}...`);

            await this.rest.put(
                Routes.applicationGuildCommands(config.clientId, guildId),
                { body: [] }
            );

            console.log('✅ All guild application commands deleted.');
        } catch (error) {
            console.error('❌ Error deleting guild commands:', error);
        }
    }
}
