const { zokou } = require("../framework/zokou");
const fs = require("fs-extra");
const path = require("path");

const antibugPath = path.join(__dirname, "../bdd/antibug.json");

if (!fs.existsSync(path.join(__dirname, "../bdd"))) {
    fs.mkdirSync(path.join(__dirname, "../bdd"));
}

if (!fs.existsSync(antibugPath)) {
    fs.writeFileSync(antibugPath, JSON.stringify({ status: "off" }, null, 2));
}

zokou({
    nomCom: "antibug",
    categorie: "General",
    reaction: "🛡️",
    desc: "Enable or disable antibug protection",
    fromMe: true
}, async (dest, zk, commandeOptions) => {
    const { repondre, arg } = commandeOptions;

    if (!arg[0] || !["on", "off"].includes(arg[0].toLowerCase())) {
        return repondre(`*❗ Usage:* .antibug on | off

📢 *JOIN OUR CHANNEL*
🔗 https://whatsapp.com/channel/0029Vb7LxhRGE56l9woRjd2g

_Powered by Sebastian_`);
    }

    const status = arg[0].toLowerCase();
    fs.writeFileSync(antibugPath, JSON.stringify({ status }, null, 2));
    
    if (status === "on") {
        await repondre(`✅ *ANTIBUG ENABLED*

Bot will now detect and block users who send bugs.

📢 *JOIN OUR CHANNEL*
🔗 https://whatsapp.com/channel/0029Vb7LxhRGE56l9woRjd2g

_Powered by Sebastian_`);
    } else {
        await repondre(`⚠️ *ANTIBUG DISABLED*

📢 *JOIN OUR CHANNEL*
🔗 https://whatsapp.com/channel/0029Vb7LxhRGE56l9woRjd2g

_Powered by Sebastian_`);
    }
});
