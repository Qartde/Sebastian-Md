const util = require('util');
const fs = require('fs-extra');
const { zokou } = require(__dirname + "/../framework/zokou");
const { format } = require(__dirname + "/../framework/mesfonctions");
const os = require("os");
const moment = require("moment-timezone");
const s = require(__dirname + "/../set");
const more = String.fromCharCode(8206);
const readmore = more.repeat(4001);

zokou({ 
    nomCom: "repo", 
    aliases: ["repository", "github", "script"],
    reaction: "📂",
    categorie: "General" 
}, async (dest, zk, commandeOptions) => {
    
    let { ms, repondre, prefixe, nomAuteurMessage, mybotpic } = commandeOptions;
    
    // Get current time
    const now = new Date();
    const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const date = now.toLocaleDateString('en-US', { 
        day: 'numeric', 
        month: 'short', 
        year: 'numeric' 
    });
    
    // System info
    const uptime = process.uptime();
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    
    // ============= REPO INFO MESSAGE =============
    let repoMsg = `
╔══════════════════════════╗
║     📂 *REPOSITORY INFO*  📂
╚══════════════════════════╝

╭━──━─━─━─━─━─━─━─━─━─━╮
┃  ✦ *BOT INFORMATION* ✦
┃
┃  👑 *Owner* : ${s.OWNER_NAME || 'Sebastian'}
┃  🤖 *Bot* : ${s.BOT || 'Sebastian-MD'}
┃  ⏰ *Time* : ${time} ┃ ${date}
┃  📡 *Uptime* : ${hours}h ${minutes}m
┃  🔰 *Prefix* : 「 ${s.PREFIXE || '.'} 」
┃
╰━──━─━─━─━─━─━─━─━─━─━╯

┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  📌 *OFFICIAL LINKS* 📌
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃
┃  📢 *CHANNEL 1*
┃  ├─ https://whatsapp.com/channel/0029Vb7LxhRGE56l9woRjd2g
┃
┃  📢 *CHANNEL 2*
┃  ├─ https://whatsapp.com/channel/0029Vb7LxhRGE56l9woRjd2g
┃
┃  👥 *GROUP*
┃  ├─ https://chat.whatsapp.com/DTnrZzULVtP5r0E9rhoFOj
┃
┃  📂 *REPOSITORY*
┃  ├─ https://github.com/bravesebastian458-dotcom/Sebastian-Md
┃
┃  ⭐ *STAR THIS REPO* ⭐
┃  └─ Don't forget to star ⭐
┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

╔══════════════════════════╗
║  ✦ *MADE EASY BY SEBASTIAN* ✦
║  💫 _Join channel for updates_
╚══════════════════════════╝

> *${s.BOT || 'Sebastian-MD'}* is ready to serve you! ✨
`;

    // ============= SEND WITH MEDIA =============
    var lien = mybotpic();
    
    try {
        // If video/gif
        if (lien && lien.match(/\.(mp4|gif)$/i)) {
            await zk.sendMessage(dest, { 
                video: { url: lien }, 
                caption: repoMsg,
                gifPlayback: true,
                mentions: [nomAuteurMessage]
            }, { quoted: ms });
        } 
        // If image
        else if (lien && lien.match(/\.(jpeg|png|jpg)$/i)) {
            await zk.sendMessage(dest, { 
                image: { url: lien }, 
                caption: repoMsg,
                mentions: [nomAuteurMessage]
            }, { quoted: ms });
        } 
        // If no media or media not supported
        else {
            // Try to send with buttons
            try {
                const buttons = [
                    {
                        buttonId: 'channel',
                        buttonText: { displayText: '📢 JOIN CHANNEL' },
                        type: 1
                    },
                    {
                        buttonId: 'group',
                        buttonText: { displayText: '👥 JOIN GROUP' },
                        type: 1
                    },
                    {
                        buttonId: 'repo',
                        buttonText: { displayText: '📂 VIEW REPO' },
                        type: 1
                    }
                ];

                await zk.sendMessage(dest, {
                    text: repoMsg,
                    footer: `✨ ${s.BOT || 'Sebastian-MD'} - Premium Bot ✨`,
                    buttons: buttons,
                    headerType: 1
                }, { quoted: ms });
            } catch (buttonError) {
                // If buttons fail, send plain text
                await repondre(repoMsg);
            }
        }
    } catch (e) {
        console.log("❌ Repo command error: " + e);
        // Fallback to plain text
        await repondre(repoMsg);
    }
});

// ==================== CHANNEL COMMAND ====================
zokou({ 
    nomCom: "channel", 
    aliases: ["chan", "newsletter"],
    reaction: "📢",
    categorie: "General" 
}, async (dest, zk, commandeOptions) => {
    
    let { repondre, ms, mybotpic } = commandeOptions;
    
    const channelMsg = `
╔══════════════════════════╗
║     📢 *OFFICIAL CHANNEL*  📢
╚══════════════════════════╝

┏━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  🔔 *Join our channel for:*
┃  ├─ Latest updates
┃  ├─ New features
┃  ├─ Bug fixes
┃  ├─ Tips & tricks
┃  └─ Community news
┣━━━━━━━━━━━━━━━━━━━━━━━━┫
┃
┃  📌 *CHANNEL LINK:*
┃  ├─ https://whatsapp.com/channel/0029Vb7LxhRGE56l9woRjd2g
┃
┃  📌 *BACKUP CHANNEL:*
┃  ├─ https://whatsapp.com/channel/0029Vb7LxhRGE56l9woRjd2g
┃
┃  👥 *SUPPORT GROUP:*
┃  ├─ https://chat.whatsapp.com/DTnrZzULVtP5r0E9rhoFOj
┃
┗━━━━━━━━━━━━━━━━━━━━━━━━┛

💫 *Click the link above to join!*
> _Don't forget to follow for updates_
`;

    try {
        const pic = mybotpic();
        if (pic && pic.match(/\.(jpeg|png|jpg)$/i)) {
            await zk.sendMessage(dest, { 
                image: { url: pic }, 
                caption: channelMsg
            }, { quoted: ms });
        } else {
            await repondre(channelMsg);
        }
    } catch {
        await repondre(channelMsg);
    }
});

// ==================== GROUP LINK COMMAND ====================
zokou({ 
    nomCom: "joingroup", 
    aliases: ["support", "group"],
    reaction: "👥",
    categorie: "General" 
}, async (dest, zk, commandeOptions) => {
    
    let { repondre, ms, mybotpic } = commandeOptions;
    
    const groupMsg = `
╔══════════════════════════╗
║     👥 *SUPPORT GROUP*   👥
╚══════════════════════════╝

┏━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  🎯 *Why join our group?*
┃  ├─ Get help instantly
┃  ├─ Share ideas
┃  ├─ Report bugs
┃  ├─ Request features
┃  └─ Meet other users
┣━━━━━━━━━━━━━━━━━━━━━━━━┫
┃
┃  📌 *GROUP LINK:*
┃  ├─ https://chat.whatsapp.com/DTnrZzULVtP5r0E9rhoFOj
┃
┗━━━━━━━━━━━━━━━━━━━━━━━━┛

💫 *Click the link to join!*
> _Be respectful to others_
`;

    try {
        const pic = mybotpic();
        if (pic && pic.match(/\.(jpeg|png|jpg)$/i)) {
            await zk.sendMessage(dest, { 
                image: { url: pic }, 
                caption: groupMsg
            }, { quoted: ms });
        } else {
            await repondre(groupMsg);
        }
    } catch {
        await repondre(groupMsg);
    }
});

// ==================== SCRIPT COMMAND ====================
zokou({ 
    nomCom: "script", 
    aliases: ["source", "code"],
    reaction: "📜",
    categorie: "General" 
}, async (dest, zk, commandeOptions) => {
    
    let { repondre, ms, mybotpic } = commandeOptions;
    
    const scriptMsg = `
╔══════════════════════════╗
║     📜 *SOURCE CODE*     📜
╚══════════════════════════╝

┏━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  📂 *GitHub Repository:*
┃  ├─ https://github.com/bravesebastian458-dotcom/Sebastian-Md
┃
┃  ⭐ *STAR THIS REPO*
┃  ├─ Show your support
┃
┃  🔧 *How to deploy:*
┃  ├─ 1. Fork the repo
┃  ├─ 2. Scan QR code
┃  ├─ 3. Deploy on Heroku
┃  └─ 4. Enjoy!
┃
┃  📌 *Requirements:*
┃  ├─ Node.js v16+
┃  ├─ WhatsApp account
┃  └─ Heroku account
┃
┗━━━━━━━━━━━━━━━━━━━━━━━━┛

💫 *Give a ⭐ star to support!*
> _Made with ❤️ by Sebastian_
`;

    try {
        const pic = mybotpic();
        if (pic && pic.match(/\.(jpeg|png|jpg)$/i)) {
            await zk.sendMessage(dest, { 
                image: { url: pic }, 
                caption: scriptMsg
            }, { quoted: ms });
        } else {
            await repondre(scriptMsg);
        }
    } catch {
        await repondre(scriptMsg);
    }
});
