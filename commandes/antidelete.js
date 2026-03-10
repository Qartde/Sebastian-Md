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
    const { repondre, arg, verifAdmin, superUser } = commandeOptions;

    // Only owner or sudo can use this command
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

All deleted messages will be forwarded to your DM.

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
            let deletedMessage = null;
            let messageType = "unknown";
            let messageContent = "";
            let mediaBuffer = null;
            
            try {
                // Try to load from store.json
                const storePath = './store.json';
                if (fs.existsSync(storePath)) {
                    const storeData = fs.readFileSync(storePath, 'utf8');
                    const jsonData = JSON.parse(storeData);
                    
                    if (jsonData.messages && jsonData.messages[chatJid]) {
                        const messages = jsonData.messages[chatJid];
                        deletedMessage = messages.find(msg => msg.key.id === messageId);
                    }
                }
            } catch (storeError) {
                console.log("Error reading store:", storeError.message);
            }
            
            // If found in store, extract content
            if (deletedMessage && deletedMessage.message) {
                const msg = deletedMessage.message;
                
                if (msg.conversation) {
                    messageType = "text";
                    messageContent = msg.conversation;
                } 
                else if (msg.extendedTextMessage?.text) {
                    messageType = "text";
                    messageContent = msg.extendedTextMessage.text;
                }
                else if (msg.imageMessage) {
                    messageType = "image";
                    messageContent = msg.imageMessage.caption || "";
                    mediaBuffer = await downloadMedia(zk, msg.imageMessage, 'image');
                }
                else if (msg.videoMessage) {
                    messageType = "video";
                    messageContent = msg.videoMessage.caption || "";
                    mediaBuffer = await downloadMedia(zk, msg.videoMessage, 'video');
                }
                else if (msg.stickerMessage) {
                    messageType = "sticker";
                    mediaBuffer = await downloadMedia(zk, msg.stickerMessage, 'sticker');
                }
                else if (msg.audioMessage) {
                    messageType = "audio";
                    mediaBuffer = await downloadMedia(zk, msg.audioMessage, 'audio');
                }
                else if (msg.documentMessage) {
                    messageType = "document";
                    messageContent = msg.documentMessage.fileName || "";
                }
            }
            
            const channelUrl = "https://whatsapp.com/channel/0029Vb7LxhRGE56l9woRjd2g";
            
            // Prepare caption for owner
            let caption = `╭━━━ *『 DELETED MESSAGE 』* ━━━╮
┃
┃ 👤 *Sender:* ${senderNumber}
┃ 💬 *Chat:* ${chatName}
┃ 📌 *Type:* ${messageType.toUpperCase()}
┃ 🕐 *Time:* ${new Date().toLocaleString()}
┃
`;

            if (messageContent) {
                caption += `┃ 📝 *Content:*\n┃ ${messageContent}\n┃\n`;
            }
            
            caption += `╰━━━━━━━━━━━━━━━━━━━━━━━━━━╯

📢 *JOIN OUR CHANNEL*
🔗 ${channelUrl}

_Powered by Sebastian_`;
            
            // Send to owner
            if (ownerJid) {
                if (mediaBuffer && (messageType === 'image' || messageType === 'video' || messageType === 'sticker' || messageType === 'audio')) {
                    // Send with media
                    let mediaMessage = {};
                    
                    if (messageType === 'image') {
                        mediaMessage = { 
                            image: mediaBuffer,
                            caption: caption
                        };
                    } else if (messageType === 'video') {
                        mediaMessage = { 
                            video: mediaBuffer,
                            caption: caption
                        };
                    } else if (messageType === 'sticker') {
                        // Send sticker first
                        await zk.sendMessage(ownerJid, { 
                            sticker: mediaBuffer
                        });
                        // Then send caption separately
                        await zk.sendMessage(ownerJid, { text: caption });
                        return;
                    } else if (messageType === 'audio') {
                        mediaMessage = { 
                            audio: mediaBuffer,
                            mimetype: 'audio/mp4',
                            caption: caption
                        };
                    }
                    
                    if (Object.keys(mediaMessage).length > 0) {
                        await zk.sendMessage(ownerJid, mediaMessage);
                    }
                } else {
                    // Send as text
                    await zk.sendMessage(ownerJid, { text: caption });
                }
                
                console.log(`✅ Deleted ${messageType} forwarded to owner`);
            }
            
        } catch (error) {
            console.error("❌ Anti-delete error:", error);
        }
    }
};
