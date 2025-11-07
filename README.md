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
