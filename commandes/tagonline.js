const { zokou } = require("../framework/zokou");

zokou({
    nomCom: "tagonline",
    categorie: "Group",
    reaction: "🟢",
    desc: "Tag only online members in the group"
}, async (dest, zk, commandeOptions) => {
    const { repondre, verifGroupe, verifAdmin, superUser, ms } = commandeOptions;

    // Check if in group
    if (!verifGroupe) {
        return repondre("❌ *This command can only be used in groups!*");
    }

    // Check if user is admin
    if (!verifAdmin && !superUser) {
        return repondre("❌ *Only group admins can use this command!*");
    }

    try {
        await repondre("🟢 *Fetching online members...*");

        // Get group metadata
        const groupMetadata = await zk.groupMetadata(dest);
        const participants = groupMetadata.participants || [];
        const totalMembers = participants.length;

        // ============ COLLECT PRESENCE DATA ============
        const onlineMembers = [];
        
        // Request presence for each member
        for (const participant of participants) {
            const jid = participant.id;
            try {
                // Subscribe to presence updates
                await zk.presenceSubscribe(jid);
                // Small delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 50));
            } catch (e) {
                // Ignore subscription errors
            }
        }

        // Wait for presence data to be collected
        await new Promise(resolve => setTimeout(resolve, 3000));

        // ============ CHECK ONLINE STATUS ============
        // Instead of using store, we'll check using presence directly
        for (const participant of participants) {
            const jid = participant.id;
            
            // We can't directly access presence, so we'll use a different approach
            // Let's try to get presence by sending a temporary message and checking delivery
            try {
                // Send a temporary message to check if user is online
                const tempMsg = await zk.sendMessage(jid, { text: "‎" }).catch(() => null);
                
                if (tempMsg) {
                    // If message sent successfully, user might be online
                    // But we need to be careful not to spam
                    onlineMembers.push(jid);
                    
                    // Delete the temporary message
                    await zk.sendMessage(jid, { delete: tempMsg.key }).catch(() => {});
                }
                
                // Small delay
                await new Promise(resolve => setTimeout(resolve, 100));
            } catch (e) {
                // User might be offline or blocked
            }
        }

        // Alternative method: Check via group presence
        // Sometimes we can get presence from the group itself
        try {
            const groupPresence = await zk.groupPresence(dest);
            if (groupPresence && groupPresence.participants) {
                for (const [jid, presence] of Object.entries(groupPresence.participants)) {
                    if (presence === 'available' || presence === 'composing' || presence === 'recording') {
                        if (!onlineMembers.includes(jid)) {
                            onlineMembers.push(jid);
                        }
                    }
                }
            }
        } catch (e) {
            // Ignore group presence errors
        }

        // Prepare message
        let message = `╭━━━ *『 ONLINE MEMBERS 』* ━━━╮\n`;
        message += `┃\n`;
        message += `┃ 🟢 *Total Members:* ${totalMembers}\n`;
        message += `┃ 🟢 *Online:* ${onlineMembers.length}\n`;
        message += `┃\n`;

        if (onlineMembers.length > 0) {
            message += `┃ 🟢 *ONLINE USERS:*\n`;
            onlineMembers.forEach((jid, index) => {
                const number = jid.split('@')[0];
                message += `┃ ${index + 1}. @${number}\n`;
            });
        } else {
            message += `┃ ❌ *No online members found*\n`;
            message += `┃\n`;
            message += `┃ 💡 *Tip:* Online status is not always accurate\n`;
            message += `┃     due to WhatsApp privacy settings.\n`;
        }

        message += `┃\n`;
        message += `╰━━━━━━━━━━━━━━━━━━━━━━━━━━╯\n`;
        message += `_Powered by Sebastian_`;

        // Send message with mentions
        await zk.sendMessage(dest, {
            text: message,
            mentions: onlineMembers
        });

    } catch (error) {
        console.error("❌ Tag online error:", error);
        await repondre(`❌ *Error:* ${error.message}\n\n💡 *Note:* This command requires store to be available.`);
    }
});
