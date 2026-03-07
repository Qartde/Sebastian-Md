const util = require('util');
const fs = require('fs-extra');
const { zokou } = require(__dirname + "/../framework/zokou");
const { format } = require(__dirname + "/../framework/mesfonctions");
const os = require("os");
const moment = require("moment-timezone");
const s = require(__dirname + "/../set");
const more = String.fromCharCode(8206);
const readmore = more.repeat(4001);

// ==================== COMMAND DESCRIPTIONS ====================
const commandDescriptions = {
    // Group commands
    "tagall": "📢 Tag all group members",
    "hidetag": "🎤 Send hidden tag message",
    "link": "🔗 Get group invite link",
    "info": "ℹ️ Show group information",
    "promote": "👑 Promote member to admin",
    "demote": "📉 Demote admin to member",
    "remove": "👢 Remove member from group",
    "del": "🗑️ Delete a message",
    "group": "🔒 Open/close group",
    "gname": "📝 Change group name",
    "gdesc": "📋 Change group description",
    "gpp": "🖼️ Change group picture",
    "antilink": "🔗 Anti-link protection",
    "antibot": "🤖 Anti-bot protection",
    "automute": "⏰ Auto mute group",
    "autounmute": "⏰ Auto unmute group",
    "fkick": "👢 Kick by country code",
    "nsfw": "🔞 NSFW content control",
    "left": "🚪 Bot leave group",
    
    // Download commands
    "apk": "📱 Download Android apps",
    "yt": "▶️ Download YouTube video",
    "ytmp3": "🎵 YouTube to MP3",
    "tiktok": "📱 TikTok downloader",
    "instagram": "📸 Instagram downloader",
    "facebook": "📘 Facebook downloader",
    
    // Utility commands
    "sticker": "🎭 Create sticker from image",
    "toimage": "🖼️ Convert sticker to image",
    "smaker": "✨ Create text sticker",
    "google": "🔍 Google search",
    "weather": "🌤️ Weather information",
    "ytsearch": "🎬 YouTube search",
    "shorten": "🔗 Shorten URL",
    "qr": "📊 Generate QR code",
    "lyrics": "🎤 Song lyrics",
    "translate": "🌍 Translate text",
    "define": "📚 Dictionary definition",
    "calc": "🧮 Calculator",
    
    // AI commands
    "imagine": "🎨 Generate AI image",
    "draw": "✏️ Draw with AI",
    "remix": "🔄 Remix image",
    "aistatus": "📊 AI status",
    "aimodel": "🤖 Select AI model",
    
    // Auto react commands
    "autoreact": "💚 Auto react to status",
    
    // Menu commands
    "menu": "📋 Main menu",
    "menu2": "🎯 Quick menu",
    "groupmenu": "👥 Group menu",
    "aimenu2": "🤖 AI menu",
    "downloadmenu": "📥 Download menu",
    "adminmenu": "👑 Admin menu",
    "utilmenu": "🛠️ Utility menu",
    "quickmenu": "⚡ Fast menu",
    "status2": "📊 Bot status"
};

zokou({ nomCom: "menu", categorie: "General" }, async (dest, zk, commandeOptions) => {
    let { ms, repondre, prefixe, nomAuteurMessage, mybotpic } = commandeOptions;
    let { cm } = require(__dirname + "/../framework/zokou");
    var coms = {};
    var mode = "public";
    
    if ((s.MODE).toLocaleLowerCase() != "yes") {
        mode = "private";
    }

    // Organize commands by category
    cm.map(async (com, index) => {
        if (!coms[com.categorie])
            coms[com.categorie] = [];
        coms[com.categorie].push(com.nomCom);
    });

    moment.tz.setDefault('Etc/GMT');
    const temps = moment().format('HH:mm:ss');
    const date = moment().format('DD/MM/YYYY');

    // System information
    const totalRam = (os.totalmem() / (1024 ** 3)).toFixed(2);
    const freeRam = (os.freemem() / (1024 ** 3)).toFixed(2);
    const usedRam = (totalRam - freeRam).toFixed(2);
    const uptime = os.uptime();
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const cpuModel = os.cpus()[0].model;

    // ============= PREMIUM HEADER =============
    let infoMsg = `
╔══════════════════════════╗
║     ✦ *${s.BOT}* ✦     ║
║  _Premium WhatsApp Bot_   ║
╚══════════════════════════╝

╭━──━─━─━─━─━─━─━─━─━─━╮
┃  ✦ *BOT INFORMATION* ✦
┃
┃ 👑 *Owner* : ${s.OWNER_NAME}
┃ 🔰 *Prefix* : 「 ${s.PREFIXE} 」
┃ 📊 *Mode* : ${mode === "public" ? "🌍 Public" : "🔒 Private"}
┃
┃ ⏰ *Date* : ${date}
┃ ⌚ *Time* : ${temps}
┃ 📡 *Uptime* : ${hours}h ${minutes}m
┃
┃ 💻 *RAM* : ${usedRam}GB / ${totalRam}GB
┃ 🔧 *CPU* : ${os.cpus().length} Cores
┃ 📱 *Platform* : ${os.platform()}
┃
┃ ✨ *Commands* : ${cm.length} available
┃ 🚀 *Version* : 2.0.0
┃
╰━──━─━─━─━─━─━─━─━─━─━╯
${readmore}`;

    // ============= CATEGORIES SECTION =============
    let menuMsg = `
╔══════════════════════════╗
║    📋 *COMMANDS MENU*    ║
╚══════════════════════════╝

`;

    // Category emoji mapping
    const categoryEmojis = {
        "Group": "👥",
        "Download": "📥",
        "Utility": "🛠️",
        "AI": "🤖",
        "General": "📌",
        "Admin": "👑",
        "Mods": "⚙️",
        "Recherche": "🔍",
        "Security": "🛡️"
    };

    // Sort categories alphabetically
    const sortedCategories = Object.keys(coms).sort();

    for (const cat of sortedCategories) {
        const emoji = categoryEmojis[cat] || "📌";
        const commands = coms[cat].sort();
        
        menuMsg += `┏━━━❖━─━─━─━─━─━❖━━━┓
┃   ${emoji} *${cat.toUpperCase()}* ${emoji}
┗━━━❖━─━─━─━─━─━❖━━━┛
`;

        for (const cmd of commands) {
            const desc = commandDescriptions[cmd] || "⚡ Command available";
            menuMsg += `┃ ✦ *${s.PREFIXE}${cmd}*\n`;
            menuMsg += `┃   ↳ ${desc}\n`;
        }
        menuMsg += `┃\n`;
    }

    // ============= FOOTER =============
    menuMsg += `
╔══════════════════════════╗
║  ✦ *${s.BOT} - Premium Bot* ✦
║
║  📌 *Total Commands:* ${cm.length}
║  ⚡ *Status:* 🟢 Online
║  💎 *Creator:* ${s.OWNER_NAME}
║
║  📢 *Join channel:* .channel
║  💚 *Auto React:* ${s.AUTO_REACT_STATUS === 'yes' ? '✅ Active' : '❌ Inactive'}
║
║  _Type .help [command]_
║  _for more details_
╚══════════════════════════╝

> *${s.BOT}* is ready to serve you! ✨
`;

    // ============= SEND MENU =============
    var lien = mybotpic();
    
    if (lien && lien.match(/\.(mp4|gif)$/i)) {
        try {
            await zk.sendMessage(dest, { 
                video: { url: lien }, 
                caption: infoMsg + menuMsg, 
                footer: `✨ ${s.BOT} - Premium WhatsApp Bot ✨`,
                gifPlayback: true,
                mentions: [nomAuteurMessage]
            }, { quoted: ms });
        } catch (e) {
            console.log("Menu error: " + e);
            repondre(infoMsg + menuMsg);
        }
    } 
    else if (lien && lien.match(/\.(jpeg|png|jpg)$/i)) {
        try {
            await zk.sendMessage(dest, { 
                image: { url: lien }, 
                caption: infoMsg + menuMsg,
                footer: `✨ ${s.BOT} - Premium WhatsApp Bot ✨`,
                mentions: [nomAuteurMessage]
            }, { quoted: ms });
        } catch (e) {
            console.log("Menu error: " + e);
            repondre(infoMsg + menuMsg);
        }
    } 
    else {
        repondre(infoMsg + menuMsg);
    }
});

// ==================== MENU YA KIFARANZA (FRENCH) ====================
zokou({ nomCom: "menufr", categorie: "General" }, async (dest, zk, commandeOptions) => {
    let { ms, repondre, prefixe, nomAuteurMessage, mybotpic } = commandeOptions;
    
    const menuFr = `
╔══════════════════════════╗
║     ✦ *${s.BOT}* ✦     ║
║  _Bot WhatsApp Premium_   ║
╚══════════════════════════╝

┏━━━━━━━━━━━━━━━━━━━━┓
┃  👤 *Utilisateur:* ${nomAuteurMessage}
┃  🔰 *Préfixe:* ${s.PREFIXE}
┃  📊 *Mode:* ${s.MODE === 'yes' ? 'Public' : 'Privé'}
┃  💚 *Auto React:* ${s.AUTO_REACT_STATUS === 'yes' ? '✅' : '❌'}
┗━━━━━━━━━━━━━━━━━━━━┛

╭━─━─━─━─━─━─━─━─━─━╮
┃  📋 *COMMANDES DISPONIBLES*
┃  
┃  👥 **GROUPE**
┃  ├─ .tagall - Mentionner tous
┃  ├─ .hidetag - Mention cachée
┃  ├─ .link - Lien du groupe
┃  ├─ .info - Infos groupe
┃  └─ .group open/close
┃  
┃  🛡️ **SÉCURITÉ**
┃  ├─ .antilink on/off
┃  ├─ .antibot on/off
┃  └─ .nsfw on/off
┃  
┃  👑 **ADMIN**
┃  ├─ .promote / .demote
┃  ├─ .remove / .del
┃  └─ .gname / .gdesc / .gpp
┃  
┃  📥 **TÉLÉCHARGEMENT**
┃  └─ .apk [nom]
┃  
┃  🤖 **IA**
┃  ├─ .imagine [description]
┃  └─ .draw [description]
┃  
╰━─━─━─━─━─━─━─━─━─━╯

⚡ _Tapez .menu pour plus de commandes_
`;

    try {
        const pic = mybotpic();
        if (pic && pic.match(/\.(jpeg|png|jpg)$/i)) {
            await zk.sendMessage(dest, { 
                image: { url: pic }, 
                caption: menuFr
            }, { quoted: ms });
        } else {
            repondre(menuFr);
        }
    } catch {
        repondre(menuFr);
    }
});

// ==================== SIMPLE MENU ====================
zokou({ nomCom: "simplemenu", categorie: "General" }, async (dest, zk, commandeOptions) => {
    let { repondre, prefixe } = commandeOptions;
    
    const simpleMenu = `
╭━━━━━━━━━━━━━━━╮
┃  📋 *SIMPLE MENU*  📋
╰━━━━━━━━━━━━━━━╯

┏━━━━━━━━━━━━━━━━━━━━┓
┃  👥 **GROUP**
┃  ${s.PREFIXE}tagall - Tag all
┃  ${s.PREFIXE}link - Group link
┃  ${s.PREFIXE}info - Group info
┃  ${s.PREFIXE}promote - Promote
┃  ${s.PREFIXE}demote - Demote
┃  ${s.PREFIXE}remove - Remove
┃  
┃  📥 **DOWNLOAD**
┃  ${s.PREFIXE}apk [name]
┃  
┃  🛡️ **SECURITY**
┃  ${s.PREFIXE}antilink on/off
┃  ${s.PREFIXE}antibot on/off
┃  
┃  🤖 **AI**
┃  ${s.PREFIXE}imagine [prompt]
┃  
┗━━━━━━━━━━━━━━━━━━━━┛

⚡ ${s.BOT}
`;

    repondre(simpleMenu);
});

// ==================== HELP COMMAND ====================
zokou({ nomCom: "help", categorie: "General" }, async (dest, zk, commandeOptions) => {
    let { repondre, arg, ms } = commandeOptions;
    
    if (!arg || arg.length === 0) {
        return repondre(`📌 *Usage:* .help [command]\n\nExample: .help tagall\n\nType .menu to see all commands`);
    }
    
    const cmd = arg[0].toLowerCase();
    const desc = commandDescriptions[cmd] || "No description available";
    
    const helpText = `
╭━━━━━━━━━━━━━━━╮
┃  📋 *COMMAND HELP*  📋
╰━━━━━━━━━━━━━━━╯

┏━━━━━━━━━━━━━━━━━━━━┓
┃  🔰 *Command:* ${s.PREFIXE}${cmd}
┃  📝 *Description:* ${desc}
┃  
┃  💡 *Usage:*
┃  ${s.PREFIXE}${cmd} [options]
┃  
┃  📌 *Example:*
┃  ${s.PREFIXE}${cmd} 
┗━━━━━━━━━━━━━━━━━━━━┛

⚡ ${s.BOT}
`;

    repondre(helpText);
});
