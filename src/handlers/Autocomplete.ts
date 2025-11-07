import { AutocompleteInteraction } from 'discord.js';

export default class handleAutoComplete {
    public async handle(interaction: AutocompleteInteraction): Promise<any> {
        const { commandName, options } = interaction;

        if (['disablecommands'].includes(commandName)) {
            const name = options.getString('command', true);
            const data = [];
            interaction.client.slashCommand.forEach(command => {
                if (command.name.includes(name)) {
                    data.push({
                        name: command.name,
                        description: command.description,
                        value: command.name,
                    });
                }
            });
            return interaction.respond(data);
        } else if (['playlist'].includes(commandName)) {
            const name = options.getString('name', true);
            const data = [];
            await interaction.client.db.getPlaylists(interaction.user.id).then(playlists => {
                playlists.forEach(playlist => {
                    if (playlist.name.includes(name)) {
                        data.push({
                            name: playlist.name,
                            value: playlist.name,
                        });
                    }
                });
            });
            return interaction.respond(data);
        }
    }
}
