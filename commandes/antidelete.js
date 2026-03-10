const { zokou } = require("../framework/zokou");
const fs = require("fs-extra");
const path = require("path");

// Configuration file
const antideletePath = path.join(__dirname, "../bdd/antidelete.json");

// Ensure bdd folder exists
if (!fs.existsSync(path.join(__dirname, "../bdd"))) {
    fs.mkdirSync(path.join(__dirname, "../bdd"));
}

// Create config if not exists
if (!fs.existsSync(antideletePath)) {
    fs.writeFileSync(antideletePath, JSON.stringify({ status: "off" }, null, 2));
}

// Function to read anti-delete status
function isAntiDeleteOn() {
    try {
        const data = fs.readFileSync(antideletePath);
        const config = JSON.parse(data);
        return config.status === "on";
    } catch {
        return false;
    }
}

// Main command to toggle anti-delete
zokou({
    nomCom: "antidelete",
    categorie: "General",
    reaction: "🗑️",
    desc: "Enable or disable anti-delete (forward deleted messages to owner)",
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
    const newConfig = { status };

    try {
        fs.writeFileSync(antideletePath, JSON.stringify(newConfig, null, 2));
        
        const channelUrl = "https://whatsapp.com/channel/0029Vb7LxhRGE56l9woRjd2g";
        
        if (status === "on") {
            await repondre(`✅ *ANTI-DELETE ENABLED*

Deleted messages will be sent to your DM.

📢 *JOIN OUR CHANNEL*
🔗 ${channelUrl}

_Powered by Sebastian_`);
        } else {
            await repondre(`⚠️ *ANTI-DELETE DISABLED*

Deleted messages will not be forwarded.

📢 *JOIN OUR CHANNEL*
🔗 ${channelUrl}

_Powered by Sebastian_`);
        }
    } catch (e) {
        await repondre("❌ Failed to update anti-delete configuration.");
        console.error("Anti-delete write error:", e);
    }
});

// Function to download media
async function downloadMedia(zk, message, type) {
    try {
        let stream;
        if (type === 'image') {
            stream = await zk.downloadContentFromMessage(message, 'image');
        } else if (type === 'video') {
            stream = await zk.downloadContentFromMessage(message, 'video');
        } else if (type === 'audio') {
            stream = await zk.downloadContentFromMessage(message, 'audio');
        } else if (type === 'sticker') {
            stream = await zk.downloadContentFromMessage(message, 'sticker');
        } else {
            return null;
        }

        let buffer = Buffer.from([]);
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
        }
        return buffer;
    } catch (error) {
        console.log(`Error downloading ${type}:`, error.message);
        return null;
    }
}

// Function to get deleted message from store
async function getDeletedMessageFromStore(zk, chatJid, messageId) {
    try {
        // Try store.loadMessage
        if (zk.store && typeof zk.store.loadMessage === 'function') {
            const msg = await zk.store.loadMessage(chatJid, messageId);
            if (msg) return msg;
        }
        
        // Try store.json file
        const storePath = './store.json';
        if (fs.existsSync(storePath)) {
            const storeData = fs.readFileSync(storePath, 'utf8');
            const jsonData = JSON.parse(storeData);
            
            if (jsonData.messages && jsonData.messages[chatJid]) {
                const messages = jsonData.messages[chatJid];
                return messages.find(msg => msg.key.id === messageId);
            }
        }
        
        return null;
    } catch (error) {
        console.log("Error getting deleted message:", error.message);
        return null;
    }
}

// Export the anti-delete handler
module.exports = {
    isAntiDeleteOn,
    
    async handleDeletedMessage(zk, message, ownerJid) {
        try {
            // Check if anti-delete is on
            if (!isAntiDeleteOn()) return;
            
            // Check if this is a deleted message (protocol message type 0)
            if (!message.message?.protocolMessage || message.message.protocolMessage.type !== 0) {
                return;
            }
            
            // Skip bot's own messages
            if (message.key.fromMe) {
                console.log("ℹ️ Bot's own message deleted - ignoring");
                return;
            }
            
            console.log("🗑️ DELETED MESSAGE DETECTED!");
            
            // Get deleted message info
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
            
            // Try to get the deleted message from store
            const deletedMessage = await getDeletedMessageFromStore(zk, chatJid, messageId);
            
            let messageType = "UNKNOWN";
            let messageContent = "";
            let mediaBuffer = null;
            
            // If found in store, extract content
            if (deletedMessage && deletedMessage.message) {
                const msg = deletedMessage.message;
                
                if (msg.conversation) {
                    messageType = "TEXT";
                    messageContent = msg.conversation;
                    
                    // Send TEXT directly to owner
                    await zk.sendMessage(ownerJid, {
                        text: `📝 *Deleted Text:*\n\n${messageContent}\n\n👤 *From:* ${senderNumber}\n💬 *Chat:* ${chatName}`
                    });
                    
                } 
                else if (msg.extendedTextMessage?.text) {
                    messageType = "TEXT";
                    messageContent = msg.extendedTextMessage.text;
                    
                    // Send TEXT directly to owner
                    await zk.sendMessage(ownerJid, {
                        text: `📝 *Deleted Text:*\n\n${messageContent}\n\n👤 *From:* ${senderNumber}\n💬 *Chat:* ${chatName}`
                    });
                }
                else if (msg.imageMessage) {
                    messageType = "IMAGE";
                    messageContent = msg.imageMessage.caption || "";
                    mediaBuffer = await downloadMedia(zk, msg.imageMessage, 'image');
                    
                    if (mediaBuffer) {
                        await zk.sendMessage(ownerJid, {
                            image: mediaBuffer,
                            caption: `🖼️ *Deleted Image*\n👤 *From:* ${senderNumber}\n💬 *Chat:* ${chatName}\n📝 *Caption:* ${messageContent}`
                        });
                    }
                }
                else if (msg.videoMessage) {
                    messageType = "VIDEO";
                    messageContent = msg.videoMessage.caption || "";
                    mediaBuffer = await downloadMedia(zk, msg.videoMessage, 'video');
                    
                    if (mediaBuffer) {
                        await zk.sendMessage(ownerJid, {
                            video: mediaBuffer,
                            caption: `🎥 *Deleted Video*\n👤 *From:* ${senderNumber}\n💬 *Chat:* ${chatName}\n📝 *Caption:* ${messageContent}`
                        });
                    }
                }
                else if (msg.stickerMessage) {
                    messageType = "STICKER";
                    mediaBuffer = await downloadMedia(zk, msg.stickerMessage, 'sticker');
                    
                    if (mediaBuffer) {
                        await zk.sendMessage(ownerJid, {
                            sticker: mediaBuffer
                        });
                        // Send info separately
                        await zk.sendMessage(ownerJid, {
                            text: `🖼️ *Deleted Sticker*\n👤 *From:* ${senderNumber}\n💬 *Chat:* ${chatName}`
                        });
                    }
                }
                else if (msg.audioMessage) {
                    messageType = "AUDIO";
                    mediaBuffer = await downloadMedia(zk, msg.audioMessage, 'audio');
                    
                    if (mediaBuffer) {
                        await zk.sendMessage(ownerJid, {
                            audio: mediaBuffer,
                            mimetype: 'audio/mp4',
                            caption: `🎵 *Deleted Audio*\n👤 *From:* ${senderNumber}\n💬 *Chat:* ${chatName}`
                        });
                    }
                }
                else if (msg.documentMessage) {
                    messageType = "DOCUMENT";
                    messageContent = msg.documentMessage.fileName || "";
                    mediaBuffer = await downloadMedia(zk, msg.documentMessage, 'document');
                    
                    if (mediaBuffer) {
                        await zk.sendMessage(ownerJid, {
                            document: mediaBuffer,
                            fileName: messageContent,
                            caption: `📄 *Deleted Document*\n👤 *From:* ${senderNumber}\n💬 *Chat:* ${chatName}`
                        });
                    }
                }
                else {
                    // Unknown type - try to get raw
                    messageType = Object.keys(msg)[0] || "UNKNOWN";
                    await zk.sendMessage(ownerJid, {
                        text: `❓ *Deleted ${messageType}*\n👤 *From:* ${senderNumber}\n💬 *Chat:* ${chatName}\n\n*Message ID:* ${messageId}`
                    });
                }
                
                console.log(`✅ Deleted ${messageType} forwarded to owner`);
                
            } else {
                // Message not found in store
                console.log("⚠️ Could not retrieve deleted message from store");
                await zk.sendMessage(ownerJid, {
                    text: `❌ *Could not retrieve deleted message*\n👤 *From:* ${senderNumber}\n💬 *Chat:* ${chatName}\n🆔 *Message ID:* ${messageId}\n\n*Message may be too old or store unavailable.*`
                });
            }
            
        } catch (error) {
            console.error("❌ Anti-delete error:", error);
        }
    }
};
