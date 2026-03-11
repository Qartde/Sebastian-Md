const { zokou } = require("../framework/zokou");

zokou({
    nomCom: "vv",
    categorie: "General",
    reaction: "👁️",
    desc: "Save and forward view once media to your DM"
}, async (dest, zk, commandeOptions) => {
    const { ms, msgRepondu, repondre, auteurMessage, idBot, superUser } = commandeOptions;

    // Check if replying to a message
    if (!msgRepondu) {
        return repondre("❌ *Please reply to a view once message!*\n\nExample: Reply to a view once image/video with `.vv`");
    }

    // Check if user is owner or superUser
    const isOwner = auteurMessage === idBot || superUser;
    
    // Determine where to send the media
    const targetChat = isOwner ? dest : idBot;

    try {
        let mediaBuffer = null;
        let mediaType = '';
        let caption = '';

        console.log("🔍 Checking message type:", Object.keys(msgRepondu));

        // ============ VIEW ONCE DETECTION - IMPROVED ============
        
        // Check all possible view once message structures
        const viewOnceTypes = [
            'viewOnceMessageV2',
            'viewOnceMessage',
            'viewOnceMessageV2Extension',
            'ephemeralMessage'
        ];
        
        let viewOnceMessage = null;
        
        // Find which view once type exists
        for (const type of viewOnceTypes) {
            if (msgRepondu[type]) {
                console.log(`✅ Found view once type: ${type}`);
                viewOnceMessage = msgRepondu[type];
                break;
            }
        }
        
        // If not found in standard locations, check deeper
        if (!viewOnceMessage && msgRepondu.message) {
            // Try to find view once in the message object
            for (const type of viewOnceTypes) {
                if (msgRepondu.message[type]) {
                    console.log(`✅ Found view once in message.${type}`);
                    viewOnceMessage = msgRepondu.message[type];
                    break;
                }
            }
        }
        
        if (!viewOnceMessage) {
            console.log("❌ Not a view once message - available keys:", Object.keys(msgRepondu));
            return repondre("❌ *This is not a view once message!*\n\nMake sure you're replying to a message that was sent as 'View Once'.");
        }

        // Get the actual message content
        const messageContent = viewOnceMessage.message || viewOnceMessage;
        
        // Check for different media types
        if (messageContent.imageMessage) {
            mediaType = 'image';
            caption = messageContent.imageMessage.caption || '';
            console.log("📸 Image view once detected");
            mediaBuffer = await zk.downloadAndSaveMediaMessage(messageContent.imageMessage);
        }
        else if (messageContent.videoMessage) {
            mediaType = 'video';
            caption = messageContent.videoMessage.caption || '';
            console.log("🎥 Video view once detected");
            mediaBuffer = await zk.downloadAndSaveMediaMessage(messageContent.videoMessage);
        }
        else if (messageContent.audioMessage) {
            mediaType = 'audio';
            caption = messageContent.audioMessage.caption || '';
            console.log("🎵 Audio view once detected");
            mediaBuffer = await zk.downloadAndSaveMediaMessage(messageContent.audioMessage);
        }
        else if (messageContent.stickerMessage) {
            mediaType = 'sticker';
            console.log("🖼️ Sticker view once detected");
            mediaBuffer = await zk.downloadAndSaveMediaMessage(messageContent.stickerMessage);
        }
        else if (messageContent.documentMessage) {
            mediaType = 'document';
            caption = messageContent.documentMessage.caption || '';
            console.log("📄 Document view once detected");
            mediaBuffer = await zk.downloadAndSaveMediaMessage(messageContent.documentMessage);
        }
        else {
            console.log("❌ Unsupported media type in view once:", Object.keys(messageContent));
            return repondre("❌ *Unsupported media type in this view once message!*");
        }

        // If media found, send it
        if (mediaBuffer && mediaType) {
            
            // Prepare message based on type
            let messageOptions = {};
            
            if (mediaType === 'image') {
                messageOptions = {
                    image: mediaBuffer,
                    caption: caption
                };
            } else if (mediaType === 'video') {
                messageOptions = {
                    video: mediaBuffer,
                    caption: caption
                };
            } else if (mediaType === 'audio') {
                messageOptions = {
                    audio: mediaBuffer,
                    mimetype: 'audio/mp4'
                };
            } else if (mediaType === 'sticker') {
                messageOptions = {
                    sticker: mediaBuffer
                };
            } else if (mediaType === 'document') {
                messageOptions = {
                    document: mediaBuffer,
                    fileName: 'document',
                    caption: caption
                };
            }

            // Add context info
            messageOptions.contextInfo = {
                mentionedJid: [auteurMessage],
                forwardingScore: 999,
                isForwarded: true
            };

            // Send to target
            await zk.sendMessage(targetChat, messageOptions, { quoted: ms });
            
            // Send confirmation
            if (!isOwner) {
                const confirmMsg = `✅ *View once ${mediaType} saved!*\n📨 Sent to owner's DM.`;
                await repondre(confirmMsg);
            }
            
            console.log(`✅ View once ${mediaType} saved and sent to ${isOwner ? 'group' : 'owner DM'}`);
            
        } else {
            return repondre("❌ *Failed to download media!*");
        }

    } catch (error) {
        console.error("❌ View once error:", error);
        
        // More detailed error message
        if (error.message.includes('download')) {
            await repondre(`❌ *Failed to download media:* ${error.message}`);
        } else {
            await repondre(`❌ *Error:* ${error.message}`);
        }
    }
});
