/* eslint-disable @typescript-eslint/no-empty-function */
import { inspect } from 'node:util';

export class WebHook {
    url: any;
    name: any;
    constructor(url: string, name: string) {
        this.url = url;
        this.name = name;
    }
    public error(data: any) {
        const error = {
            title: `Error: ${this.name || 'Process<Unknown>'}`,
            description: `\`\`\`js\n${inspect(data.length > 2000 ? data.slice(0, 2000) : data)}\`\`\``,
            color: 0xff0000,
            timestamp: new Date().toISOString(),
        };
        if (this.url) {
            fetch(this.url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ embeds: [error] }),
            }).catch(() => {});
        }
    }
    public success(data: any) {
        const success = {
            title: `Success: ${this.name || 'Process<Unknown>'}`,
            description: `\`\`\`js\n${inspect(data.length > 2000 ? data.slice(0, 2000) : data)}\`\`\``,
            color: 0x00ff00,
            timestamp: new Date().toISOString(),
        };
        if (this.url) {
            fetch(this.url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ embeds: [success] }),
            }).catch(() => {});
        }
    }

    public info(data: any) {
        const info = {
            title: `Info: ${this.name || 'Process<Unknown>'}`,
            description: `\`\`\`js\n${inspect(data.length > 2000 ? data.slice(0, 2000) : data)}\`\`\``,
            color: 0x0000ff,
            timestamp: new Date().toISOString(),
        };
        if (this.url) {
            fetch(this.url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ embeds: [info] }),
            }).catch(() => {});
        }
    }

    public warn(data: any) {
        const warn = {
            title: `Warn: ${this.name || 'Process<Unknown>'}`,
            description: `\`\`\`js\n${inspect(data.length > 2000 ? data.slice(0, 2000) : data)}\`\`\``,
            color: 0xffff00,
            timestamp: new Date().toISOString(),
        };
        if (this.url) {
            fetch(this.url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ embeds: [warn] }),
            }).catch(() => {});
        }
    }
    public send(data: any) {
        if (this.url) {
            fetch(this.url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            }).catch(() => {});
        }
    }
}
