const { zokou } = require("../framework/zokou");

zokou({
    nomCom: "remove",
    categorie: "Group",
    reaction: "👢",
    desc: "Remove a member by replying to their message or mentioning them"
}, async (dest, zk, commandeOptions) => {
    const { repondre, verifGroupe, verifAdmin, superUser, ms, auteurMessage } = commandeOptions;

    // Check if in group
    if (!verifGroupe) {
        return repondre("❌ *This command can only be used in groups!*");
    }

    // Check if user is admin or superUser
    if (!verifAdmin && !superUser) {
        return repondre("❌ *Only group admins can remove members!*");
    }

    // Check if bot is admin
    const groupMetadata = await zk.groupMetadata(dest);
    const botId = zk.user.id.split(':')[0] + '@s.whatsapp.net';
    const isBotAdmin = groupMetadata.participants?.some(p => p.id === botId && p.admin) || false;

    if (!isBotAdmin) {
        return repondre("❌ *Bot needs to be admin to remove members!*");
    }

    let targetUser = null;

    // Method 1: Reply to user's message
    if (ms.message?.extendedTextMessage?.contextInfo?.participant) {
        targetUser = ms.message.extendedTextMessage.contextInfo.participant;
    }
    
    // Method 2: Mention in message
    if (!targetUser && ms.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
        targetUser = ms.message.extendedTextMessage.contextInfo.mentionedJid[0];
    }

    // Method 3: If no reply/mention, check if number provided in args
    const { arg } = commandeOptions;
    if (!targetUser && arg && arg[0]) {
        let number = arg[0].replace(/[^0-9]/g, '');
        if (number.startsWith('0')) number = number.substring(1);
        if (!number.startsWith('255') && number.length === 9) number = '255' + number;
        targetUser = number + '@s.whatsapp.net';
    }

    if (!targetUser) {
        return repondre("❌ *Please reply to a user's message or mention them to remove!*\n\nExample:\n- Reply to their message with `.remove`\n- Type `.remove @user`\n- Type `.remove 255693629079`");
    }

    // Don't allow removing bot
    if (targetUser === botId) {
        return repondre("❌ *I cannot remove myself!*");
    }

    // Don't allow removing owner/superUser
    if (targetUser === auteurMessage || superUser) {
        return repondre("❌ *You cannot remove the bot owner!*");
    }

    try {
        await repondre(`⏳ *Removing @${targetUser.split('@')[0]}...*`);

        // Remove the user
        await zk.groupParticipantsUpdate(dest, [targetUser], "remove");
        
        // Success message
        await zk.sendMessage(dest, {
            text: `✅ *@${targetUser.split('@')[0]} has been removed from the group.*`,
            mentions: [targetUser]
        });

    } catch (error) {
        console.error("❌ Remove error:", error);
        
        if (error.message.includes("not-authorized")) {
            await repondre("❌ *Bot is not authorized to remove members.*\nMake sure the bot is an admin.");
        } else if (error.message.includes("group-participant")) {
            await repondre("❌ *Cannot remove this user.*\nThey might already be removed or not in the group.");
        } else {
            await repondre(`❌ *Failed to remove user:* ${error.message}`);
        }
    }
});
