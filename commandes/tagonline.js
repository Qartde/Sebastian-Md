const { zokou } = require("../framework/zokou");

zokou({
    nomCom: "tagonline",
    categorie: "Group",
    reaction: "🟢",
    desc: "Tag only online members in the group"
}, async (dest, zk, commandeOptions) => {
    const { repondre, verifGroupe, verifAdmin, superUser, ms } = commandeOptions;

    if (!verifGroupe) {
        return repondre("❌ *This command can only be used in groups!*");
    }

    if (!verifAdmin && !superUser) {
        return repondre("❌ *Only group admins can use this command!*");
    }

    try {
        await repondre("🟢 *Fetching online members...*");

        const groupMetadata = await zk.groupMetadata(dest);
        const participants = groupMetadata.participants || [];
        const totalMembers = participants.length;

        // Get presence data
        const onlineMembers = [];
        
        for (const participant of participants) {
            const jid = participant.id;
            try {
                await zk.presenceSubscribe(jid);
                await new Promise(resolve => setTimeout(resolve, 50));
            } catch (e) {}
        }

        await new Promise(resolve => setTimeout(resolve, 2000));

        for (const participant of participants) {
            const jid = participant.id;
            const presence = store.presences?.[jid];
            if (presence?.lastKnownPresence === 'available' || 
                presence?.lastKnownPresence === 'composing' ||
                presence?.lastKnownPresence === 'recording') {
                onlineMembers.push(jid);
            }
        }

        if (onlineMembers.length === 0) {
            return repondre("❌ *No online members found at the moment.*");
        }

        // Create mention text
        let mentionText = "";
        onlineMembers.forEach(jid => {
            mentionText += `@${jid.split('@')[0]} `;
        });

        const message = `╭━━━ *『 ONLINE MEMBERS 』* ━━━╮
┃
┃ 🟢 *Total Online:* ${onlineMembers.length}/${totalMembers}
┃
┃ 📢 *Tagging online members:*
┃ ${mentionText}
┃
╰━━━━━━━━━━━━━━━━━━━━━━━━━━╯
_Powered by Sebastian_`;

        await zk.sendMessage(dest, {
            text: message,
            mentions: onlineMembers
        });

    } catch (error) {
        console.error("❌ Tag online error:", error);
        await repondre(`❌ *Error:* ${error.message}`);
    }
});
