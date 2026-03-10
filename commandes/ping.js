const { zokou } = require("../framework/zokou");
const os = require("os");
const moment = require("moment-timezone");

zokou({
    nomCom: "ping",
    categorie: "General",
    reaction: "🏓",
    desc: "Check bot response time with image"
}, async (dest, zk, commandeOptions) => {
    const { repondre, ms, mybotpic } = commandeOptions;
    
    const start = Date.now();
    
    // Get system info
    const uptime = process.uptime();
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = Math.floor(uptime % 60);
    
    const memory = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
    const totalMem = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2);
    const platform = os.platform();
    const arch = os.arch();
    const cpu = os.cpus()[0]?.model || "Unknown";
    const hostname = os.hostname();
    
    // Calculate ping
    const end = Date.now();
    const responseTime = end - start;
    
    // Speed indicator
    let speedColor = "🟢";
    if (responseTime > 500) speedColor = "🔴";
    else if (responseTime > 200) speedColor = "🟡";
    
    // Create ping message
    const pingMessage = `╭━━━ *『 PONG! 』* ━━━╮
┃
┃ 🏓 *RESPONSE TIME*
┃ └─ ${responseTime}ms ${speedColor}
┃
┃ ⚡ *SYSTEM INFO*
┃ ├─ 💻 OS: ${platform} ${arch}
┃ ├─ 🖥️ Host: ${hostname.substring(0, 15)}
┃ ├─ 🧠 CPU: ${cpu.substring(0, 20)}...
┃ ├─ 💾 RAM: ${memory}MB / ${totalMem}GB
┃ └─ ⏱️ Uptime: ${hours}h ${minutes}m ${seconds}s
┃
┃ 📊 *BOT STATUS*
┃ ├─ 🔰 Status: 🟢 ONLINE
┃ ├─ 🚀 Speed: ${responseTime}ms
┃ └─ 📅 Time: ${moment().format('HH:mm:ss DD/MM/YYYY')}
┃
╰━━━━━━━━━━━━━━━━━━━━━━━━━━╯
> *Powered by Sebastian*`;

    // Get bot image
    const imageUrl = mybotpic ? mybotpic() : "https://files.catbox.moe/zotx9t.jpg";

    // Send with image
    try {
        if (imageUrl.match(/\.(jpeg|png|jpg)$/i)) {
            await zk.sendMessage(dest, {
                image: { url: imageUrl },
                caption: pingMessage
            }, { quoted: ms });
        } else {
            await repondre(pingMessage);
        }
    } catch (e) {
        await repondre(pingMessage);
    }
});
