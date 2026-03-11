const fs = require('fs');
const conf = require("../set.js"); // Tumia set.js yako

const handleGreeting = async (m, gss) => {
  try {
    const textLower = m.body?.toLowerCase() || '';

    const triggerWords = [
      'save', 'statusdown', 'take', 'sent', 'giv', 'gib', 'upload',
      'send me', 'znt', 'snt', 'ayak', 'do', 'mee'
    ];

    if (triggerWords.includes(textLower)) {
      if (m.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
        const quotedMessage = m.message.extendedTextMessage.contextInfo.quotedMessage;

        // Check if it's an image
        if (quotedMessage.imageMessage) {
          const imageCaption = quotedMessage.imageMessage.caption || '';
          const imageUrl = await gss.downloadAndSaveMediaMessage(quotedMessage.imageMessage);
          await gss.sendMessage(m.from, {
            image: { url: imageUrl },
            caption: imageCaption,
            contextInfo: {
              mentionedJid: [m.sender],
              forwardingScore: 9999,
              isForwarded: true,
            },
          });
        }

        // Check if it's a video
        if (quotedMessage.videoMessage) {
          const videoCaption = quotedMessage.videoMessage.caption || '';
          const videoUrl = await gss.downloadAndSaveMediaMessage(quotedMessage.videoMessage);
          await gss.sendMessage(m.from, {
            video: { url: videoUrl },
            caption: videoCaption,
            contextInfo: {
              mentionedJid: [m.sender],
              forwardingScore: 9999,
              isForwarded: true,
            },
          });
        }

        // Check if it's a sticker
        if (quotedMessage.stickerMessage) {
          const stickerUrl = await gss.downloadAndSaveMediaMessage(quotedMessage.stickerMessage);
          await gss.sendMessage(m.from, {
            sticker: { url: stickerUrl },
            contextInfo: {
              mentionedJid: [m.sender],
              forwardingScore: 9999,
              isForwarded: true,
            },
          });
        }

        // Check if it's audio
        if (quotedMessage.audioMessage) {
          const audioUrl = await gss.downloadAndSaveMediaMessage(quotedMessage.audioMessage);
          await gss.sendMessage(m.from, {
            audio: { url: audioUrl },
            mimetype: 'audio/mp4',
            contextInfo: {
              mentionedJid: [m.sender],
              forwardingScore: 9999,
              isForwarded: true,
            },
          });
        }
      }
    }
  } catch (error) {
    console.error('Error in handleGreeting:', error);
  }
};

module.exports = handleGreeting;
