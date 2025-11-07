import { AttachmentBuilder, EmbedBuilder } from 'discord.js';
import config from '../../config';
import { Command, BotClient, Message } from '../../structures/index';
import { inspect } from 'node:util';

export default class EvalCommand extends Command {
    constructor(client: BotClient) {
        super(client, {
            name: 'eval',
            description: {
                content: 'Evaluate some code',
                usage: 'eval <code>',
                examples: ['eval 1+1'],
            },
            aliases: ['e'],
            category: 'owner',
            cooldown: 5,
            args: true,
            permissions: {
                dev: true,
                client: [],
                user: [],
            },
            slashCommand: false,
            messageCommand: true,
        });
    }

    public async messageRun(message: Message, args: string[]): Promise<any> {
        const msg = await message.channel.send('Evaluating...');
        try {
            const code = args[0] == '-a' ? args.slice(1).join(' ') : args.join(' ');
            const fullCode = args[0] == '-a' ? '(async () => {\n{code}\n})()' : '{code}';
            const str = fullCode.replace('{code}', code);
            const output = inspect(await eval(str), { depth: 0 });
            this.client.user.edit({});
            if (output.includes(config.token)) {
                await msg.edit('Token detected so I cannot show the output');
                return;
            }
            if (output.length < 1024 && code.length < 1024) {
                const embed = new EmbedBuilder()
                    .addFields(
                        { name: 'Input', value: `\`\`\`js\n${code}\`\`\`` },
                        { name: 'Output', value: `\`\`\`js\n${output}\`\`\`` }
                    )
                    .setColor(this.client.config.colors.dc);
                await msg.edit({ embeds: [embed], content: null });
            } else {
                const attachmened = new AttachmentBuilder(Buffer.from(output)).setName(
                    'output.txt'
                );
                await msg.edit({ content: 'Output is too long', files: [attachmened] });
            }
        } catch (err) {
            message.safeReply(`\`ERROR\` \`\`\`xl\n${err}\n\`\`\``);
        }
    }
}
