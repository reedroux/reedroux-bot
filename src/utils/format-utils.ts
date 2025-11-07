import { ApplicationCommand, Guild, Locale } from 'discord.js';
import { filesize } from 'filesize';

export class FormatUtils {
    public static fileSize(bytes: number): string {
        return filesize(bytes, { output: 'string', pad: true, round: 2 }).toString();
    }
}