const fs = require("fs-extra");
const path = require("path");

const antibugPath = path.join(__dirname, "../bdd/antibug.json");

function isAntibugOn() {
    try {
        const data = fs.readFileSync(antibugPath);
        const config = JSON.parse(data);
        return config.status === "on";
    } catch {
        return false;
    }
}

function detectBug(message) {
    if (!message || typeof message !== 'string') return { isBug: false };
    
    const bugPatterns = [
        { pattern: /.{500,}/, type: "CHARACTER_OVERLOAD", desc: "Message too long (>500 chars)" },
        { pattern: /(?:[\uD800-\uDBFF][\uDC00-\uDFFF]|[\u2600-\u27FF]){15,}/, type: "EMOJI_OVERLOAD", desc: "Too many emojis/special chars" },
        { pattern: /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>|<[^>]+>/i, type: "HTML_INJECTION", desc: "HTML/Script tag detected" },
        { pattern: /@everyone|@here|@all/i, type: "MASS_MENTION", desc: "Mass mention attempt" },
        { pattern: /(.)\1{20,}/, type: "REPEATED_CHARS", desc: "Too many repeated characters" },
        { pattern: /(https?:\/\/[^\s]+){5,}/, type: "URL_SPAM", desc: "Multiple URLs detected" }
    ];
    
    for (let bug of bugPatterns) {
        if (bug.pattern.test(message)) {
            return { isBug: true, type: bug.type, description: bug.desc };
        }
    }
    return { isBug: false };
}

async function blockUser(zk, sender) {
    try {
        await zk.updateBlockStatus(sender, 'block');
        return true;
    } catch {
        try {
            const numberOnly = sender.split('@')[0];
            await zk.updateBlockStatus(numberOnly + '@s.whatsapp.net', 'block');
            return true;
        } catch {
            return false;
        }
    }
}

async function processIncomingMessage(zk, message, sender) {
    try {
        if (!isAntibugOn()) return { blocked: false };
        
        const messageText = message.message?.conversation || 
                            message.message?.extendedTextMessage?.text ||
                            message.message?.imageMessage?.caption || "";
        
        if (!messageText) return { blocked: false };
        
        const detection = detectBug(messageText);
        
        if (detection.isBug) {
            console.log(`🚨 BUG DETECTED: ${detection.type} from ${sender}`);
            
            // Try to delete in groups
            if (message.key.remoteJid.endsWith('@g.us')) {
                try {
                    await zk.sendMessage(message.key.remoteJid, { delete: message.key });
                } catch (e) {}
            }
            
            // Block user
            const blocked = await blockUser(zk, sender);
            
            // Notify
            const notification = `╭━━━ *『 ANTIBUG 』* ━━━╮
┃
┃ 🚨 *BUG DETECTED!*
┃
┃ 📛 *Type:* ${detection.type}
┃ 👤 *User:* @${sender.split('@')[0]}
┃
┃ 🔨 *Blocked:* ${blocked ? 'YES' : 'NO'}
┃
╰━━━━━━━━━━━━━━━━━━━━

📢 *JOIN OUR CHANNEL*
🔗 https://whatsapp.com/channel/0029Vb7LxhRGE56l9woRjd2g

_Powered by Sebastian_`;

            await zk.sendMessage(message.key.remoteJid, {
                text: notification,
                mentions: [sender]
            }).catch(() => {});
            
            return { blocked: true, reason: detection, userBlocked: blocked };
        }
        
        return { blocked: false };
        
    } catch (error) {
        console.error("❌ Antibug error:", error);
        return { blocked: false };
    }
}

module.exports = { processIncomingMessage };
