const { zokou } = require("../framework/zokou");
const os = require("os");
const moment = require("moment-timezone");

zokou({
    nomCom: "ping",
    categorie: "General",
    reaction: "🏓",
    desc: "Check bot response time"
}, async (dest, zk, commandeOptions) => {
    const { repondre } = commandeOptions;
    
    const start = Date.now();
    await repondre("🏓 *Pinging...*");
    const end = Date.now();
    
    const channelUrl = "https://whatsapp.com/channel/0029Vb7LxhRGE56l9woRjd2g";
    
    const pingMessage = `╭━━━ *『 PONG! 』* ━━━╮
┃
┃ 🏓 *Response:* ${end - start}ms
┃ ⏱️ *Time:* ${moment().format('HH:mm:ss')}
┃
╰━━━━━━━━━━━━━━━━━━━━━━━━━━╯

📢 *JOIN OUR CHANNEL*
🔗 ${channelUrl}

_Powered by Sebastian_`;

    await repondre(pingMessage);
});
