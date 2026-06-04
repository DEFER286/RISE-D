const { Bot, webhookCallback } = require('grammy');
const { GoogleGenAI } = require('@google/gen-ai');

// Environment Variables dubbisuu
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Bot fi Gemini initialize godhi
const bot = new Bot(TELEGRAM_TOKEN);
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
const model = ai.getGenerativeModel({ model: "gemini-pro" });

// Ergaa jalqabaa (Start command)
bot.command("start", (ctx) => {
    ctx.reply("Gamachuun dhufte! Ani Rise-d Bot dha. Gaaffii qabdu kamiyyuu na gaafadhu, Gemini AI fayyadameen siif deebisa!");
});

// Ergaa namootaa fudhatanii Gemini irraa deebii fiduu
bot.on("message:text", async (ctx) => {
    const userMessage = ctx.message.text;
    try {
        await ctx.replyWithChatAction("typing");
        const result = await model.generateContent(userMessage);
        const response = await result.response;
        const aiReply = response.text();
        await ctx.reply(aiReply);
    } catch (error) {
        console.error("Dogoggorri uumameera:", error);
        await ctx.reply("Yeroo ammaa kanatti dogoggorri xiqqaan uumameera. Maaloo xiqqoo turee yaali!");
    }
});

// Vercel Serverless Node.js Handler export godhi
// Kun koodii keenya gara API Vercel irratti hojjetutti jijjiira
module.exports = webhookCallback(bot, 'express');
