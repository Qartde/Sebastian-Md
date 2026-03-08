const { zokou } = require("../framework/zokou");
const { downloadContentFromMessage } = require("@whiskeysockets/baileys");

zokou({
    nomCom: "vv",
    categorie: "General"
}, async (dest, zk, commandeOptions) => {

    const { ms, repondre } = commandeOptions;

    if (!ms.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
        return repondre("Please reply to a view once image or video.");
    }

    let quoted = ms.message.extendedTextMessage.contextInfo.quotedMessage;

    if (quoted.viewOnceMessage) {

        let viewOnce = quoted.viewOnceMessage.message;
        let type = Object.keys(viewOnce)[0];

        let stream = await downloadContentFromMessage(
            viewOnce[type],
            type === "imageMessage" ? "image" : "video"
        );

        let buffer = Buffer.from([]);

        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
        }

        if (type === "imageMessage") {
            await zk.sendMessage(dest, { image: buffer }, { quoted: ms });
        } else if (type === "videoMessage") {
            await zk.sendMessage(dest, { video: buffer }, { quoted: ms });
        }

    } else {
        repondre("This is not a view once message.");
    }

});