const { zokou } = require("../framework/zokou");

// ============ UPTIME COMMAND (SIMPLE) ============
zokou({
    nomCom: "uptime",
    categorie: "General",
    reaction: "⏱️",
    desc: "Check bot uptime",
    fromMe: true
}, async (dest, zk, commandeOptions) => {
    const { repondre } = commandeOptions;
    
    const uptime = process.uptime();
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = Math.floor(uptime % 60);
    
    await repondre(`⏱️ *Bot Uptime:* ${hours}h ${minutes}m ${seconds}s`);
});

// ============ ALIVE COMMAND ============
zokou({
    nomCom: "alive",
    categorie: "General",
    reaction: "💚",
    desc: "Check if bot is alive",
    fromMe: true
}, async (dest, zk, commandeOptions) => {
    const { repondre } = commandeOptions;
    
    const uptime = process.uptime();
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = Math.floor(uptime % 60);
    
    await repondre(`🤖 *I'm alive!*\n⏱️ Uptime: ${hours}h ${minutes}m ${seconds}s`);
});
