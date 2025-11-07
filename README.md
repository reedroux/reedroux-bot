<center><img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&height=200&section=header&text=reedroux-bot&fontSize=80&fontAlignY=35&animation=twinkling&fontColor=gradient" /></center>

---

<p align="center">
  <a href="https://github.com/reedroux/reedroux-bot">
    <img src="https://avatars.githubusercontent.com/u/143243553?s=200&v=4" alt="reedroux-bot" width="200" height="200">
  </a>
</p>

<h3 align="center">reedroux-bot</h3>

<p align="center">
  A next-generation Node.js Discord bot built with TypeScript and Prisma ORM.
  <br />
  <a href="https://github.com/reedroux/reedroux-bot/issues">Report Bug</a>
  ·
  <a href="https://github.com/reedroux/reedroux-bot/issues">Request Feature</a>
</p>

---

## ⚡ Features

- Built with **Node.js v20+** and **TypeScript**
- Database integration using **Prisma ORM**
- Fully configurable via `config.ts` and `.env`
- Easy build and start workflow (`npm run build`, `npm start`)
- Modular and clean command structure
- Lightweight, efficient, and production-ready
- Perfect for VPS or dedicated server environments

---

## 🧩 Requirements

Before installing and running the bot, make sure you have:

- [Node.js v20.18.2+](https://nodejs.org/)
- [npm](https://www.npmjs.com/)
- (Optional) PostgreSQL or SQLite database

---

## 🚀 Installation from source

1. Clone the Reedroux-Bot repository:

```bash
git clone https://github.com/reedroux/reedroux-bot.git
```

2. Change to the Lavamusic directory:

```bash
cd reedroux-bot
```

3. Install the required packages:

```bash
npm i
```

4. Compile:

```
npm run build
```

5. Copy the `.env.example` file to `.env` and fill in all required values:

6. Copy the `example.<The data source you want to use>.schema.prisma` file to `schema.prisma` in `prisma` folder
   Note: If you want to use sqlite, skip this step.
   If you are using a different data source, don't forget to fill in the `DATABASE_URL` value in `.env`.

7. Generate the Prisma client:

```bash
npx run db:push
```

8. Run the migrations (Only if you want to migrate your database):

```bash
npx run db:migrate
```

9. Run the bot:

Note: You can also run `run.bat` to easily run the bot on Windows.

```bash
npm start
```

10. Invite the bot to your server:

Generate an invite link for your bot and invite it to your server using the [Discord Developer Portal](https://discord.com/developers/applications) or [Permissions Calculator](https://discordapi.com/permissions.html).

## 🔗 Useful Links

- ![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white) [Node.js](https://nodejs.org/en/download/)
- ![Discord.js](https://img.shields.io/badge/Discord.js-7289DA?style=for-the-badge&logo=discord&logoColor=white) [Discord.js](https://discord.js.org/#/)
- ![Lavalink](https://img.shields.io/badge/Lavalink-7289DA?style=for-the-badge&logo=discord&logoColor=white) [Lavalink](https://github.com/lavalink-devs/Lavalink)
- ![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white) [MongoDB](https://www.mongodb.com/try/download/community)
- ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-336791?style=for-the-badge&logo=postgresql&logoColor=white) [PostgreSQL](https://www.postgresql.org/download/)
- ![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white) [Docker](https://www.docker.com/)
- ![Docker-Compose](https://img.shields.io/badge/Docker--Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white) [Docker-Compose](https://docs.docker.com/compose/)


## 🔐 License

Distributed under the GPL-3.0 license. See [![LICENSE](https://img.shields.io/github/license/itzappu/lavamusic?style=social)](https://github.com/itzappu/lavamusic/blob/main/LICENSE) for more information [READ](https://discord.com/channels/942117923001098260/942120006219624469/1278087961774129314).

## ☕ Donate

Do you like this project? Support it by donating!
[![Paypal]()](https://paypal.me/reedroux45)

## 👥 Contributors

Thanks go to these wonderful people:
<a href="https://github.com/dawgcodes/reedroux-bot/graphs/contributors">
<img src="https://contrib.rocks/image?repo=dawgcodes/reedroux-bot" />
</a>
