const { zokou } = require("../framework/zokou");

zokou({
    nomCom: "vv",
    categorie: "General",
    reaction: "👁️",
    desc: "Save view once media",
    fromMe: true
}, async (dest, zk, commandeOptions) => {
    const { ms, msgRepondu, repondre, auteurMessage, idBot } = commandeOptions;

    if (!msgRepondu) {
        return repondre("❌ *Reply to a view once message!*");
    }

    try {
        // Try to get the actual message content
        let realMsg = msgRepondu;
        
        // Unwrap view once if present
        if (msgRepondu.viewOnceMessageV2) {
            realMsg = msgRepondu.viewOnceMessageV2.message;
        } else if (msgRepondu.viewOnceMessage) {
            realMsg = msgRepondu.viewOnceMessage.message;
        } else if (msgRepondu.message?.viewOnceMessageV2) {
            realMsg = msgRepondu.message.viewOnceMessageV2.message;
        } else if (msgRepondu.message?.viewOnceMessage) {
            realMsg = msgRepondu.message.viewOnceMessage.message;
        }

        // Check for media
        let mediaMsg = null;
        let mediaType = '';
        
        if (realMsg.imageMessage) {
            mediaMsg = realMsg.imageMessage;
            mediaType = 'image';
        } else if (realMsg.videoMessage) {
            mediaMsg = realMsg.videoMessage;
            mediaType = 'video';
        } else if (realMsg.audioMessage) {
            mediaMsg = realMsg.audioMessage;
            mediaType = 'audio';
        } else if (realMsg.stickerMessage) {
            mediaMsg = realMsg.stickerMessage;
            mediaType = 'sticker';
        }

        if (!mediaMsg) {
            return repondre("❌ *Not a view once message or unsupported media!*");
        }

        // Download media
        await repondre(`⏳ *Downloading ${mediaType}...*`);
        const mediaPath = await zk.downloadAndSaveMediaMessage(mediaMsg);

        // Determine target (DM to owner if not owner)
        const isOwner = auteurMessage === idBot;
        const targetChat = isOwner ? dest : idBot;

        // Prepare and send
        const messageOptions = {
            [mediaType]: { url: mediaPath }
        };

        if (mediaType === 'audio') {
            messageOptions.mimetype = 'audio/mp4';
        }

        if (realMsg.imageMessage?.caption || realMsg.videoMessage?.caption) {
            messageOptions.caption = realMsg.imageMessage?.caption || realMsg.videoMessage?.caption;
        }

        await zk.sendMessage(targetChat, messageOptions);

        if (!isOwner) {
            await repondre("✅ *Sent to owner's DM!*");
        }

    } catch (error) {
        console.error("❌ Error:", error);
        await repondre(`❌ *Failed:* ${error.message}`);
    }
});
