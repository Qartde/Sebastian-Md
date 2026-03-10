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

// Function to get deleted message from store with multiple methods
async function getDeletedMessageFromStore(zk, chatJid, messageId) {
    const methods = [];
    
    // METHOD 1: Try zk.store directly
    try {
        if (zk.store) {
            if (typeof zk.store.loadMessage === 'function') {
                const msg = await zk.store.loadMessage(chatJid, messageId);
                if (msg) {
                    console.log("✅ Found via zk.store.loadMessage");
                    return msg;
                }
            }
            
            if (zk.store.messages && zk.store.messages[chatJid]) {
                const msg = zk.store.messages[chatJid].find(m => m.key.id === messageId);
                if (msg) {
                    console.log("✅ Found via zk.store.messages");
                    return msg;
                }
            }
        }
    } catch (e) {
        methods.push(`Method 1 failed: ${e.message}`);
    }
    
    // METHOD 2: Try global.store
    try {
        if (global.store) {
            if (global.store.messages && global.store.messages[chatJid]) {
                const msg = global.store.messages[chatJid].find(m => m.key.id === messageId);
                if (msg) {
                    console.log("✅ Found via global.store");
                    return msg;
                }
            }
        }
    } catch (e) {
        methods.push(`Method 2 failed: ${e.message}`);
    }
    
    // METHOD 3: Try reading store.json file
    try {
        const storePath = './store.json';
        if (fs.existsSync(storePath)) {
            const storeData = fs.readFileSync(storePath, 'utf8');
            const jsonData = JSON.parse(storeData);
            
            // Try different structures
            if (jsonData.messages && jsonData.messages[chatJid]) {
                const msg = jsonData.messages[chatJid].find(m => m.key.id === messageId);
                if (msg) {
                    console.log("✅ Found via store.json messages");
                    return msg;
                }
            }
            
            if (jsonData[chatJid]) {
                const msg = jsonData[chatJid].find(m => m.key.id === messageId);
                if (msg) {
                    console.log("✅ Found via store.json direct");
                    return msg;
                }
            }
        }
    } catch (e) {
        methods.push(`Method 3 failed: ${e.message}`);
    }
    
    // METHOD 4: Try to get from message history
    try {
        // Try to get recent messages from the chat
        const recentMessages = await zk.loadMessages(chatJid, 50);
        if (recentMessages && recentMessages.length > 0) {
            const msg = recentMessages.find(m => m.key.id === messageId);
            if (msg) {
                console.log("✅ Found via loadMessages");
                return msg;
            }
        }
    } catch (e) {
        methods.push(`Method 4 failed: ${e.message}`);
    }
    
    console.log("❌ All methods failed to find message:", methods);
    return null;
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
            
            console.log(`🔍 Looking for message ID: ${messageId} in ${chatJid}`);
            
            // Try to get the deleted message from store
            const deletedMessage = await getDeletedMessageFromStore(zk, chatJid, messageId);
            
            if (deletedMessage && deletedMessage.message) {
                const msg = deletedMessage.message;
                console.log("✅ Message found! Type:", Object.keys(msg));
                
                if (msg.conversation) {
                    // TEXT MESSAGE
                    await zk.sendMessage(ownerJid, {
                        text: `📝 *Deleted Text*\n\n${msg.conversation}\n\n👤 *From:* ${senderNumber}\n💬 *Chat:* ${chatName}`
                    });
                    console.log("✅ Deleted text forwarded");
                }
                else if (msg.extendedTextMessage?.text) {
                    // EXTENDED TEXT
                    await zk.sendMessage(ownerJid, {
                        text: `📝 *Deleted Text*\n\n${msg.extendedTextMessage.text}\n\n👤 *From:* ${senderNumber}\n💬 *Chat:* ${chatName}`
                    });
                    console.log("✅ Deleted extended text forwarded");
                }
                else if (msg.imageMessage) {
                    // IMAGE
                    try {
                        const buffer = await downloadMedia(zk, msg.imageMessage, 'image');
                        if (buffer) {
                            await zk.sendMessage(ownerJid, {
                                image: buffer,
                                caption: `🖼️ *Deleted Image*\n👤 *From:* ${senderNumber}\n💬 *Chat:* ${chatName}\n📝 *Caption:* ${msg.imageMessage.caption || ''}`
                            });
                            console.log("✅ Deleted image forwarded");
                        }
                    } catch (e) {
                        console.log("Failed to download image:", e);
                    }
                }
                else if (msg.videoMessage) {
                    // VIDEO
                    try {
                        const buffer = await downloadMedia(zk, msg.videoMessage, 'video');
                        if (buffer) {
                            await zk.sendMessage(ownerJid, {
                                video: buffer,
                                caption: `🎥 *Deleted Video*\n👤 *From:* ${senderNumber}\n💬 *Chat:* ${chatName}\n📝 *Caption:* ${msg.videoMessage.caption || ''}`
                            });
                            console.log("✅ Deleted video forwarded");
                        }
                    } catch (e) {
                        console.log("Failed to download video:", e);
                    }
                }
                else if (msg.stickerMessage) {
                    // STICKER
                    try {
                        const buffer = await downloadMedia(zk, msg.stickerMessage, 'sticker');
                        if (buffer) {
                            await zk.sendMessage(ownerJid, { sticker: buffer });
                            await zk.sendMessage(ownerJid, {
                                text: `🖼️ *Deleted Sticker*\n👤 *From:* ${senderNumber}\n💬 *Chat:* ${chatName}`
                            });
                            console.log("✅ Deleted sticker forwarded");
                        }
                    } catch (e) {
                        console.log("Failed to download sticker:", e);
                    }
                }
                else if (msg.audioMessage) {
                    // AUDIO
                    try {
                        const buffer = await downloadMedia(zk, msg.audioMessage, 'audio');
                        if (buffer) {
                            await zk.sendMessage(ownerJid, {
                                audio: buffer,
                                mimetype: 'audio/mp4',
                                caption: `🎵 *Deleted Audio*\n👤 *From:* ${senderNumber}\n💬 *Chat:* ${chatName}`
                            });
                            console.log("✅ Deleted audio forwarded");
                        }
                    } catch (e) {
                        console.log("Failed to download audio:", e);
                    }
                }
                else {
                    // UNKNOWN TYPE
                    await zk.sendMessage(ownerJid, {
                        text: `❓ *Deleted ${Object.keys(msg)[0] || 'Unknown'}*\n👤 *From:* ${senderNumber}\n💬 *Chat:* ${chatName}\n\n*Message ID:* ${messageId}`
                    });
                }
            } else {
                console.log("❌ Message not found in store");
                
                // Send notification that message couldn't be retrieved
                await zk.sendMessage(ownerJid, {
                    text: `❌ *Could not retrieve deleted message*\n👤 *From:* ${senderNumber}\n💬 *Chat:* ${chatName}\n🆔 *Message ID:* ${messageId}\n\n*Try forwarding the message before deletion next time.*`
                });
            }
            
        } catch (error) {
            console.error("❌ Anti-delete error:", error);
        }
    }
};
