// commandes/antilink.js

const { 
    mettreAJourAction,
    ajouterOuMettreAJourJid,
    verifierEtatJid,
    recupererActionJid
} = require("../bdd/antilien");

const { getWarnCountByJID } = require('../bdd/warn');

module.exports = async (zk, origineMessage, nomCom, arg, repondre, superUser, verifGroupe, verifAdmin, ms, auteurMsgRepondu, msgRepondu) => {
    
    // Only work in groups
    if (!verifGroupe) {
        repondre("❌ This command can only be used in groups!");
        return;
    }

    // Check if user is admin
    if (!verifAdmin && !superUser) {
        repondre("❌ Only group admins can use this command!");
        return;
    }

    // Main command: antilink
    if (nomCom === 'antilink' || nomCom === 'antilien') {
        
        // No arguments - show status
        if (!arg || arg.length === 0) {
            try {
                const etat = await verifierEtatJid(origineMessage);
                const action = await recupererActionJid(origineMessage);
                
                let statusMsg = `╭━━━ *『 ANTI-LINK STATUS 』* ━━━╮\n`;
                statusMsg += `┃\n`;
                statusMsg += `┃ 📌 *Group:* ${origineMessage.split('@')[0]}\n`;
                statusMsg += `┃ ⚡ *Status:* ${etat ? '✅ ACTIVE' : '❌ INACTIVE'}\n`;
                statusMsg += `┃ 🎯 *Action:* ${action ? action.toUpperCase() : 'SUPP'}\n`;
                statusMsg += `┃\n`;
                statusMsg += `┃ *Commands:*\n`;
                statusMsg += `┃ • ,antilink on - Activate\n`;
                statusMsg += `┃ • ,antilink off - Deactivate\n`;
                statusMsg += `┃ • ,antilink action delete/remove/warn - Set action\n`;
                statusMsg += `┃ • ,antilink status - Check status\n`;
                statusMsg += `┃\n`;
                statusMsg += `╰━━━━━━━━━━━━━━━━━━━━━━━━━━╯`;
                
                repondre(statusMsg);
            } catch (error) {
                console.log("Antilink status error:", error);
                repondre("❌ Error fetching antilink status!");
            }
            return;
        }

        const subCommand = arg[0].toLowerCase();

        // ===== TURN ON =====
        if (subCommand === 'on' || subCommand === 'enable' || subCommand === '1') {
            try {
                await ajouterOuMettreAJourJid(origineMessage, 'oui');
                const action = await recupererActionJid(origineMessage);
                repondre(`✅ *ANTI-LINK ACTIVATED*\n\n📌 Group: ${origineMessage.split('@')[0]}\n🎯 Action: ${action.toUpperCase()}\n\nLinks will now be deleted automatically!`);
            } catch (error) {
                console.log("Antilink on error:", error);
                repondre("❌ Failed to activate antilink!");
            }
        }

        // ===== TURN OFF =====
        else if (subCommand === 'off' || subCommand === 'disable' || subCommand === '0') {
            try {
                await ajouterOuMettreAJourJid(origineMessage, 'non');
                repondre(`❌ *ANTI-LINK DEACTIVATED*\n\nLinks are now allowed in this group.`);
            } catch (error) {
                console.log("Antilink off error:", error);
                repondre("❌ Failed to deactivate antilink!");
            }
        }

        // ===== SET ACTION =====
        else if (subCommand === 'action' || subCommand === 'act') {
            if (arg.length < 2) {
                const currentAction = await recupererActionJid(origineMessage);
                repondre(`🎯 *Current Action:* ${currentAction.toUpperCase()}\n\nAvailable actions:\n• delete - Delete message only\n• remove - Remove user from group\n• warn - Give warning points\n\nUsage: ,antilink action [delete/remove/warn]`);
                return;
            }

            const action = arg[1].toLowerCase();
            if (!['delete', 'remove', 'warn', 'supp'].includes(action)) {
                repondre("❌ Invalid action! Choose: delete, remove, or warn");
                return;
            }

            // Convert to database format (supp, remove, warn)
            let dbAction = action;
            if (action === 'delete') dbAction = 'supp';
            if (action === 'remove') dbAction = 'remove';
            if (action === 'warn') dbAction = 'warn';

            try {
                await mettreAJourAction(origineMessage, dbAction);
                repondre(`✅ *ACTION UPDATED*\n\nAntilink will now: ${action.toUpperCase()}`);
            } catch (error) {
                console.log("Antilink action error:", error);
                repondre("❌ Failed to update action!");
            }
        }

        // ===== STATUS =====
        else if (subCommand === 'status' || subCommand === 'info') {
            try {
                const etat = await verifierEtatJid(origineMessage);
                const action = await recupererActionJid(origineMessage);
                
                let statusMsg = `╭━━━ *『 ANTI-LINK INFO 』* ━━━╮\n`;
                statusMsg += `┃\n`;
                statusMsg += `┃ 📌 *Group:* ${origineMessage.split('@')[0]}\n`;
                statusMsg += `┃ ⚡ *Status:* ${etat ? '✅ ACTIVE' : '❌ INACTIVE'}\n`;
                statusMsg += `┃ 🎯 *Action:* ${action.toUpperCase()}\n`;
                statusMsg += `┃\n`;
                statusMsg += `╰━━━━━━━━━━━━━━━━━━━━━━━━━━╯`;
                
                repondre(statusMsg);
            } catch (error) {
                console.log("Antilink status error:", error);
                repondre("❌ Error fetching antilink info!");
            }
        }

        // ===== HELP =====
        else if (subCommand === 'help' || subCommand === 'h') {
            const helpMsg = `╭━━━ *『 ANTI-LINK HELP 』* ━━━╮
┃
┃ *Commands:*
┃
┃ 1️⃣ *Activate:*
┃    ,antilink on
┃
┃ 2️⃣ *Deactivate:*
┃    ,antilink off
┃
┃ 3️⃣ *Set Action:*
┃    ,antilink action delete
┃    ,antilink action remove
┃    ,antilink action warn
┃
┃ 4️⃣ *Check Status:*
┃    ,antilink
┃    ,antilink status
┃
┃ 5️⃣ *Check Warns:*
┃    ,warn @user
┃
╰━━━━━━━━━━━━━━━━━━━━━━━━━━╯`;
            repondre(helpMsg);
        }

        // ===== UNKNOWN =====
        else {
            repondre(`❌ Unknown command: ${subCommand}\n\nUse ,antilink help to see available commands.`);
        }
    }

    // ===== WARN COMMAND =====
    else if (nomCom === 'warn') {
        if (!arg || arg.length === 0) {
            repondre("Usage: ,warn @user  - Check warnings for a user\nExample: ,warn @255712345678");
            return;
        }

        // Extract mentioned user
        let targetUser = null;
        if (ms.message.extendedTextMessage?.contextInfo?.mentionedJid) {
            targetUser = ms.message.extendedTextMessage.contextInfo.mentionedJid[0];
        } else if (msgRepondu) {
            targetUser = auteurMsgRepondu;
        } else if (arg[0].startsWith('@')) {
            const number = arg[0].replace('@', '') + '@s.whatsapp.net';
            targetUser = number;
        }

        if (!targetUser) {
            repondre("❌ Please mention the user or reply to their message!");
            return;
        }

        try {
            const warnCount = await getWarnCountByJID(targetUser) || 0;
            const warnLimit = 3; // Default warn limit
            
            repondre(`⚠️ *WARN INFO*\n\n👤 User: @${targetUser.split('@')[0]}\n📊 Warnings: ${warnCount}/${warnLimit}\n\n${warnCount >= warnLimit ? '❌ User has reached warn limit!' : '✅ User is within limit.'}`);
        } catch (error) {
            console.log("Warn check error:", error);
            repondre("❌ Error checking warnings!");
        }
    }
};
