const { zokou } = require("../framework/zokou");
const fs = require("fs-extra");
const path = require("path");

const antideletePath = path.join(__dirname, "../bdd/antidelete.json");

// Ensure bdd folder exists
if (!fs.existsSync(path.join(__dirname, "../bdd"))) {
    fs.mkdirSync(path.join(__dirname, "../bdd"));
}

// Create config if not exists
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

// Function to save message to store manually
async function saveMessageToStore(zk, message) {
    try {
        const storePath = './store.json';
        let storeData = { messages: {} };
        
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
            messageTimestamp: message.messageTimestamp || Date.now() / 1000
        });
        
        // Keep only last 100 messages per chat
        if (storeData.messages[chatJid].length > 100) {
            storeData.messages[chatJid] = storeData.messages[chatJid].slice(-100);
        }
        
        fs.writeFileSync(storePath, JSON.stringify(storeData, null, 2));
        return true;
    } catch (error) {
        console.log("Error saving to store:", error);
        return false;
    }
}

module.exports = {
    isAntiDeleteOn,
    
    // This function should be called for EVERY message
    async handleIncomingMessage(zk, message) {
        try {
            if (!message.message) return;
            
            // Save every message to store
            await saveMessageToStore(zk, message);
            
        } catch (error) {
            console.error("Error in handleIncomingMessage:", error);
        }
    },
    
    async handleDeletedMessage(zk, message, ownerJid) {
        try {
            console.log("🔍 ANTI-DELETE HANDLER CALLED");
            
            if (!isAntiDeleteOn()) {
                console.log("ℹ️ Anti-delete is OFF");
                return;
            }
            
            console.log("📨 Message type:", message.message ? Object.keys(message.message) : "No message");
            
            // Check if this is a deleted message
            if (!message.message?.protocolMessage) {
                console.log("ℹ️ Not a protocol message");
                return;
            }
            
            if (message.message.protocolMessage.type !== 0) {
                console.log("ℹ️ Not a delete message (type:", message.message.protocolMessage.type, ")");
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
            
            // Get sender
            let sender = deletedKey.participant || message.key.participant || chatJid;
            let senderNumber = sender.split('@')[0];
            
            // Get chat name
            let chatName = isGroup ? "Unknown Group" : "Private Chat";
            if (isGroup) {
                try {
                    const groupMetadata = await zk.groupMetadata(chatJid);
                    chatName = groupMetadata.subject || "Unknown Group";
                } catch (e) {}
            }
            
            console.log(`🔍 Looking for message ID: ${messageId} in ${chatJid}`);
            
            // Try multiple methods to find the message
            let deletedMessage = null;
            
            // METHOD 1: Try store.loadMessage
            try {
                if (zk.store && typeof zk.store.loadMessage === 'function') {
                    deletedMessage = await zk.store.loadMessage(chatJid, messageId);
                    if (deletedMessage) console.log("✅ Found via store.loadMessage");
                }
            } catch (e) {}
            
            // METHOD 2: Try reading store.json directly
            if (!deletedMessage) {
                try {
                    const storePath = './store.json';
                    if (fs.existsSync(storePath)) {
                        const storeData = fs.readFileSync(storePath, 'utf8');
                        const jsonData = JSON.parse(storeData);
                        
                        if (jsonData.messages && jsonData.messages[chatJid]) {
                            deletedMessage = jsonData.messages[chatJid].find(m => m.key.id === messageId);
                            if (deletedMessage) console.log("✅ Found via store.json");
                        }
                    }
                } catch (e) {}
            }
            
            // METHOD 3: Try to get from recent messages
            if (!deletedMessage) {
                try {
                    const recentMessages = await zk.loadMessages(chatJid, 50);
                    if (recentMessages) {
                        deletedMessage = recentMessages.find(m => m.key.id === messageId);
                        if (deletedMessage) console.log("✅ Found via loadMessages");
                    }
                } catch (e) {}
            }
            
            if (deletedMessage && deletedMessage.message) {
                const msg = deletedMessage.message;
                console.log("✅ Message found! Type:", Object.keys(msg));
                
                // Extract content
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
                console.log("❌ Message not found in any store");
                
                // Send debug info
                await zk.sendMessage(ownerJid, {
                    text: `❌ *Could not retrieve deleted message*\n👤 *From:* ${senderNumber}\n💬 *Chat:* ${chatName}\n🆔 *Message ID:* ${messageId}\n\n*Debug Info:*\n- Store exists: ${fs.existsSync('./store.json')}\n- Store size: ${fs.existsSync('./store.json') ? fs.statSync('./store.json').size : 0} bytes\n- Chat has messages in store: Check manually`
                });
            }
            
        } catch (error) {
            console.error("❌ Anti-delete error:", error);
        }
    }
};
