const { zokou } = require("../framework/zokou");
const fs = require("fs-extra");
const path = require("path");

const antideletePath = path.join(__dirname, "../bdd/antidelete.json");

if (!fs.existsSync(path.join(__dirname, "../bdd"))) {
    fs.mkdirSync(path.join(__dirname, "../bdd"));
}

if (!fs.existsSync(antideletePath)) {
    fs.writeFileSync(antideletePath, JSON.stringify({ status: "off" }, null, 2));
}

function isAntiDeleteOn() {
    try {
        const data = fs.readFileSync(antideletePath);
        const config = JSON.parse(data);
        return config.status === "on";
    } catch {
        return false;
    }
}

zokou({
    nomCom: "antidelete",
    categorie: "General",
    reaction: "🗑️",
    desc: "Enable or disable anti-delete",
    fromMe: true
}, async (dest, zk, commandeOptions) => {
    const { repondre, arg, superUser } = commandeOptions;

    if (!superUser) {
        return repondre("❌ *Only owner can use this command!*");
    }

    if (!arg[0] || !["on", "off"].includes(arg[0].toLowerCase())) {
        const channelUrl = "https://whatsapp.com/channel/0029Vb7LxhRGE56l9woRjd2g";
        return repondre(`*❗ Usage:* .antidelete on | off

📢 *JOIN OUR CHANNEL*
🔗 ${channelUrl}

_Powered by Sebastian_`);
    }

    const status = arg[0].toLowerCase();
    fs.writeFileSync(antideletePath, JSON.stringify({ status }, null, 2));
    
    const channelUrl = "https://whatsapp.com/channel/0029Vb7LxhRGE56l9woRjd2g";
    
    if (status === "on") {
        await repondre(`✅ *ANTI-DELETE ENABLED*

📢 *JOIN OUR CHANNEL*
🔗 ${channelUrl}

_Powered by Sebastian_`);
    } else {
        await repondre(`⚠️ *ANTI-DELETE DISABLED*

📢 *JOIN OUR CHANNEL*
🔗 ${channelUrl}

_Powered by Sebastian_`);
    }
});

// Function to save message to store
async function saveMessageToStore(zk, message) {
    try {
        const storePath = './store.json';
        let storeData = { messages: {} };
        
        // Read existing store
        if (fs.existsSync(storePath)) {
            const data = fs.readFileSync(storePath, 'utf8');
            storeData = JSON.parse(data);
        }
        
        const chatJid = message.key.remoteJid;
        if (!storeData.messages[chatJid]) {
            storeData.messages[chatJid] = [];
        }
        
        // Add message to store
        storeData.messages[chatJid].push({
            key: message.key,
            message: message.message,
            messageTimestamp: message.messageTimestamp || Math.floor(Date.now() / 1000)
        });
        
        // Keep only last 50 messages per chat
        if (storeData.messages[chatJid].length > 50) {
            storeData.messages[chatJid] = storeData.messages[chatJid].slice(-50);
        }
        
        // Write back to file
        fs.writeFileSync(storePath, JSON.stringify(storeData, null, 2));
        console.log(`✅ Message saved to store: ${message.key.id}`);
        return true;
    } catch (error) {
        console.log("❌ Error saving to store:", error);
        return false;
    }
}

// Function to get deleted message
async function getDeletedMessage(messageId, chatJid) {
    try {
        const storePath = './store.json';
        if (!fs.existsSync(storePath)) return null;
        
        const data = fs.readFileSync(storePath, 'utf8');
        const storeData = JSON.parse(data);
        
        if (storeData.messages && storeData.messages[chatJid]) {
            return storeData.messages[chatJid].find(m => m.key.id === messageId);
        }
        return null;
    } catch (error) {
        console.log("❌ Error reading store:", error);
        return null;
    }
}

module.exports = {
    isAntiDeleteOn,
    
    // Call this for EVERY message
    async handleIncomingMessage(zk, message) {
        try {
            if (!message.message) return;
            if (message.key.fromMe) return; // Don't save bot's own messages
            
            await saveMessageToStore(zk, message);
        } catch (error) {
            console.error("❌ handleIncomingMessage error:", error);
        }
    },
    
    async handleDeletedMessage(zk, message, ownerJid) {
        try {
            console.log("🔍 Checking for deleted message...");
            
            if (!isAntiDeleteOn()) {
                console.log("ℹ️ Anti-delete is OFF");
                return;
            }
            
            if (!message.message?.protocolMessage || message.message.protocolMessage.type !== 0) {
                return;
            }
            
            if (message.key.fromMe) {
                console.log("ℹ️ Bot's own message deleted");
                return;
            }
            
            console.log("🗑️ DELETED MESSAGE DETECTED!");
            
            const deletedKey = message.message.protocolMessage.key;
            const chatJid = deletedKey.remoteJid;
            const messageId = deletedKey.id;
            const isGroup = chatJid.endsWith('@g.us');
            
            let sender = deletedKey.participant || message.key.participant || chatJid;
            let senderNumber = sender.split('@')[0];
            
            let chatName = isGroup ? "Unknown Group" : "Private Chat";
            if (isGroup) {
                try {
                    const groupMetadata = await zk.groupMetadata(chatJid);
                    chatName = groupMetadata.subject || "Unknown Group";
                } catch (e) {}
            }
            
            console.log(`🔍 Looking for message ID: ${messageId}`);
            
            const deletedMessage = await getDeletedMessage(messageId, chatJid);
            
            if (deletedMessage && deletedMessage.message) {
                const msg = deletedMessage.message;
                console.log("✅ Message found! Type:", Object.keys(msg));
                
                if (msg.conversation) {
                    await zk.sendMessage(ownerJid, {
                        text: `📝 *Deleted Text*\n\n${msg.conversation}\n\n👤 *From:* ${senderNumber}\n💬 *Chat:* ${chatName}`
                    });
                }
                else if (msg.extendedTextMessage?.text) {
                    await zk.sendMessage(ownerJid, {
                        text: `📝 *Deleted Text*\n\n${msg.extendedTextMessage.text}\n\n👤 *From:* ${senderNumber}\n💬 *Chat:* ${chatName}`
                    });
                }
                else {
                    await zk.sendMessage(ownerJid, {
                        text: `📦 *Deleted ${Object.keys(msg)[0]}*\n👤 *From:* ${senderNumber}\n💬 *Chat:* ${chatName}\n\n*Message ID:* ${messageId}`
                    });
                }
            } else {
                console.log("❌ Message not found in store");
                
                await zk.sendMessage(ownerJid, {
                    text: `❌ *Could not retrieve deleted message*\n👤 *From:* ${senderNumber}\n💬 *Chat:* ${chatName}\n🆔 *Message ID:* ${messageId}\n\n*Message may be too old or store not saving.*`
                });
            }
            
        } catch (error) {
            console.error("❌ Anti-delete error:", error);
        }
    }
};
