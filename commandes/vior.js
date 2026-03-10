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
    const targetChat = isOwner ? dest : idBot; // If owner, send to group, else send to owner DM

    try {
        let mediaBuffer = null;
        let mediaType = '';
        let caption = '';

        // ============ CHECK DIFFERENT VIEW ONCE TYPES ============
        
        // Type 1: viewOnceMessageV2
        if (msgRepondu.viewOnceMessageV2) {
            const viewOnce = msgRepondu.viewOnceMessageV2.message;
            
            // Check for image
            if (viewOnce?.imageMessage) {
                mediaType = 'image';
                caption = viewOnce.imageMessage.caption || '';
                mediaBuffer = await zk.downloadAndSaveMediaMessage(viewOnce.imageMessage);
            }
            // Check for video
            else if (viewOnce?.videoMessage) {
                mediaType = 'video';
                caption = viewOnce.videoMessage.caption || '';
                mediaBuffer = await zk.downloadAndSaveMediaMessage(viewOnce.videoMessage);
            }
            // Check for audio
            else if (viewOnce?.audioMessage) {
                mediaType = 'audio';
                caption = viewOnce.audioMessage.caption || '';
                mediaBuffer = await zk.downloadAndSaveMediaMessage(viewOnce.audioMessage);
            }
        }
        
        // Type 2: viewOnceMessage (older format)
        else if (msgRepondu.viewOnceMessage) {
            const viewOnce = msgRepondu.viewOnceMessage.message;
            
            if (viewOnce?.imageMessage) {
                mediaType = 'image';
                caption = viewOnce.imageMessage.caption || '';
                mediaBuffer = await zk.downloadAndSaveMediaMessage(viewOnce.imageMessage);
            }
            else if (viewOnce?.videoMessage) {
                mediaType = 'video';
                caption = viewOnce.videoMessage.caption || '';
                mediaBuffer = await zk.downloadAndSaveMediaMessage(viewOnce.videoMessage);
            }
            else if (viewOnce?.audioMessage) {
                mediaType = 'audio';
                caption = viewOnce.audioMessage.caption || '';
                mediaBuffer = await zk.downloadAndSaveMediaMessage(viewOnce.audioMessage);
            }
        }
        
        // Type 3: Document with view once
        else if (msgRepondu.documentWithCaptionMessage) {
            const docMsg = msgRepondu.documentWithCaptionMessage.message?.documentMessage;
            if (docMsg) {
                mediaType = 'document';
                caption = docMsg.caption || '';
                mediaBuffer = await zk.downloadAndSaveMediaMessage(docMsg);
            }
        }

        // If media found, send it
        if (mediaBuffer && mediaType) {
            
            // Prepare message based on type
            let messageOptions = {};
            
            if (mediaType === 'image') {
                messageOptions = {
                    image: { url: mediaBuffer },
                    caption: caption
                };
            } else if (mediaType === 'video') {
                messageOptions = {
                    video: { url: mediaBuffer },
                    caption: caption
                };
            } else if (mediaType === 'audio') {
                messageOptions = {
                    audio: { url: mediaBuffer },
                    mimetype: 'audio/mp4'
                };
            } else if (mediaType === 'document') {
                messageOptions = {
                    document: { url: mediaBuffer },
                    fileName: 'document',
                    caption: caption
                };
            }

            // Add context info
            messageOptions.contextInfo = {
                mentionedJid: [auteurMessage],
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: "120363317350973861@newsletter",
                    newsletterName: "Sebastian MD",
                    serverMessageId: -1
                }
            };

            // Send to target (DM if not owner, else group)
            await zk.sendMessage(targetChat, messageOptions, { quoted: ms });
            
            // Send confirmation
            if (!isOwner) {
                await repondre("✅ *View once media has been sent to owner's DM!*");
            }
            
            console.log(`✅ View once ${mediaType} saved and sent`);
            
        } else {
            return repondre("❌ *This message is not a view once media or format not supported!*");
        }

    } catch (error) {
        console.error("❌ View once error:", error);
        await repondre(`❌ *Error:* ${error.message}`);
    }
});
