const fs = require('fs-extra');
const path = require('path');

// Import database functions
const { 
    activerAntilien, 
    desactiverAntilien, 
    changerAction,
    recupererActionJid,
    verifierEtatJid,
    getWarnLimit,
    setWarnLimit,
    resetWarnCount,
    clearAllWarns
} = require("../bdd/antilien");

const { getWarnCountByJID, ajouterUtilisateurAvecWarnCount } = require('../bdd/warn');

module.exports = async (zk, origineMessage, nomCom, arg, repondre, superUser, verifGroupe, verifAdmin, ms) => {
    
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
                const warnLimit = await getWarnLimit(origineMessage) || 3;
                
                let statusMsg = `╭━━━ *『 ANTI-LINK STATUS 』* ━━━╮\n`;
                statusMsg += `┃\n`;
                statusMsg += `┃ 📌 *Group:* ${origineMessage.split('@')[0]}\n`;
                statusMsg += `┃ ⚡ *Status:* ${etat ? '✅ ACTIVE' : '❌ INACTIVE'}\n`;
                statusMsg += `┃ 🎯 *Action:* ${action ? action.toUpperCase() : 'DELETE'}\n`;
                statusMsg += `┃ ⚠️ *Warn Limit:* ${warnLimit}\n`;
                statusMsg += `┃\n`;
                statusMsg += `┃ *Commands:*\n`;
                statusMsg += `┃ • ,antilink on - Activate\n`;
                statusMsg += `┃ • ,antilink off - Deactivate\n`;
                statusMsg += `┃ • ,antilink action [delete/remove/warn] - Set action\n`;
                statusMsg += `┃ • ,antilink warnlimit [number] - Set warn limit\n`;
                statusMsg += `┃ • ,antilink reset - Reset all warns\n`;
                statusMsg += `┃ • ,antilink clear - Clear warn counts\n`;
                statusMsg += `┃\n`;
                statusMsg += `╰━━━━━━━━━━━━━━━━━━━━━━━━━━╯`;
                
                repondre(statusMsg);
            } catch (error) {
                console.log("Antilink status error:", error);
                repondre("❌ Error fetching antilink status!");
            }
            return;
        }

        // Handle subcommands
        const subCommand = arg[0].toLowerCase();

        // ===== TURN ON =====
        if (subCommand === 'on' || subCommand === 'enable' || subCommand === '1') {
            try {
                await activerAntilien(origineMessage);
                const action = await recupererActionJid(origineMessage) || 'delete';
                repondre(`✅ *ANTI-LINK ACTIVATED*\n\n📌 Group: ${origineMessage.split('@')[0]}\n🎯 Action: ${action.toUpperCase()}\n\nLinks will now be deleted automatically!`);
            } catch (error) {
                console.log("Antilink on error:", error);
                repondre("❌ Failed to activate antilink!");
            }
        }

        // ===== TURN OFF =====
        else if (subCommand === 'off' || subCommand === 'disable' || subCommand === '0') {
            try {
                await desactiverAntilien(origineMessage);
                repondre(`❌ *ANTI-LINK DEACTIVATED*\n\nLinks are now allowed in this group.`);
            } catch (error) {
                console.log("Antilink off error:", error);
                repondre("❌ Failed to deactivate antilink!");
            }
        }

        // ===== SET ACTION =====
        else if (subCommand === 'action' || subCommand === 'act') {
            if (arg.length < 2) {
                const currentAction = await recupererActionJid(origineMessage) || 'delete';
                repondre(`🎯 *Current Action:* ${currentAction.toUpperCase()}\n\nAvailable actions:\n• delete - Delete message only\n• remove - Remove user from group\n• warn - Give warning points\n\nUsage: ,antilink action [delete/remove/warn]`);
                return;
            }

            const action = arg[1].toLowerCase();
            if (!['delete', 'remove', 'warn'].includes(action)) {
                repondre("❌ Invalid action! Choose: delete, remove, or warn");
                return;
            }

            try {
                await changerAction(origineMessage, action);
                repondre(`✅ *ACTION UPDATED*\n\nAntilink will now: ${action.toUpperCase()}`);
            } catch (error) {
                console.log("Antilink action error:", error);
                repondre("❌ Failed to update action!");
            }
        }

        // ===== SET WARN LIMIT =====
        else if (subCommand === 'warnlimit' || subCommand === 'limit' || subCommand === 'warn') {
            if (arg.length < 2) {
                const currentLimit = await getWarnLimit(origineMessage) || 3;
                repondre(`⚠️ *Current Warn Limit:* ${currentLimit}\n\nUsage: ,antilink warnlimit [number]\nExample: ,antilink warnlimit 5`);
                return;
            }

            const limit = parseInt(arg[1]);
            if (isNaN(limit) || limit < 1 || limit > 20) {
                repondre("❌ Warn limit must be a number between 1 and 20!");
                return;
            }

            try {
                await setWarnLimit(origineMessage, limit);
                repondre(`✅ *WARN LIMIT UPDATED*\n\nNew warn limit: ${limit}\nUsers will be removed after ${limit} warnings.`);
            } catch (error) {
                console.log("Antilink warnlimit error:", error);
                repondre("❌ Failed to set warn limit!");
            }
        }

        // ===== RESET ALL WARNS =====
        else if (subCommand === 'reset' || subCommand === 'resetall') {
            try {
                await resetWarnCount(origineMessage);
                repondre(`✅ *ALL WARNS RESET*\n\nAll warning counts have been cleared for this group.`);
            } catch (error) {
                console.log("Antilink reset error:", error);
                repondre("❌ Failed to reset warns!");
            }
        }

        // ===== CLEAR WARNS =====
        else if (subCommand === 'clear' || subCommand === 'clearall') {
            try {
                await clearAllWarns(origineMessage);
                repondre(`✅ *ALL WARNS CLEARED*\n\nAll warning data has been cleared for this group.`);
            } catch (error) {
                console.log("Antilink clear error:", error);
                repondre("❌ Failed to clear warns!");
            }
        }

        // ===== SHOW WARNS =====
        else if (subCommand === 'warns' || subCommand === 'list') {
            repondre("📝 Use ,warn @user to check individual warnings");
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
┃ 4️⃣ *Set Warn Limit:*
┃    ,antilink warnlimit 5
┃
┃ 5️⃣ *Reset Warns:*
┃    ,antilink reset
┃
┃ 6️⃣ *Check Status:*
┃    ,antilink
┃    ,antilink status
┃
┃ 7️⃣ *Check Warns:*
┃    ,warn @user
┃
┃ 8️⃣ *Remove Warn:*
┃    ,delwarn @user
┃
╰━━━━━━━━━━━━━━━━━━━━━━━━━━╯`;
            repondre(helpMsg);
        }

        // ===== STATUS =====
        else if (subCommand === 'status' || subCommand === 'info') {
            try {
                const etat = await verifierEtatJid(origineMessage);
                const action = await recupererActionJid(origineMessage) || 'delete';
                const warnLimit = await getWarnLimit(origineMessage) || 3;
                
                let statusMsg = `╭━━━ *『 ANTI-LINK INFO 』* ━━━╮\n`;
                statusMsg += `┃\n`;
                statusMsg += `┃ 📌 *Group:* ${origineMessage.split('@')[0]}\n`;
                statusMsg += `┃ ⚡ *Status:* ${etat ? '✅ ACTIVE' : '❌ INACTIVE'}\n`;
                statusMsg += `┃ 🎯 *Action:* ${action.toUpperCase()}\n`;
                statusMsg += `┃ ⚠️ *Warn Limit:* ${warnLimit}\n`;
                statusMsg += `┃\n`;
                statusMsg += `╰━━━━━━━━━━━━━━━━━━━━━━━━━━╯`;
                
                repondre(statusMsg);
            } catch (error) {
                console.log("Antilink status error:", error);
                repondre("❌ Error fetching antilink info!");
            }
        }

        // ===== UNKNOWN COMMAND =====
        else {
            repondre(`❌ Unknown command: ${subCommand}\n\nUse ,antilink help to see available commands.`);
        }
    }

    // ===== WARN COMMAND =====
    else if (nomCom === 'warn') {
        if (!arg || arg.length === 0) {
            // Show warns for all users or current user
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
            const warnCount = await getWarnCountByJID(targetUser);
            const warnLimit = await getWarnLimit(origineMessage) || 3;
            
            repondre(`⚠️ *WARN INFO*\n\n👤 User: @${targetUser.split('@')[0]}\n📊 Warnings: ${warnCount}/${warnLimit}\n\n${warnCount >= warnLimit ? '❌ User has reached warn limit!' : '✅ User is within limit.'}`);
        } catch (error) {
            console.log("Warn check error:", error);
            repondre("❌ Error checking warnings!");
        }
    }

    // ===== DELWARN COMMAND =====
    else if (nomCom === 'delwarn' || nomCom === 'removewarn') {
        if (!verifAdmin && !superUser) {
            repondre("❌ Only admins can remove warnings!");
            return;
        }

        if (!arg || arg.length === 0) {
            repondre("Usage: ,delwarn @user  - Remove warnings for a user\nExample: ,delwarn @255712345678");
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
            // Import the remove function
            const { removeUserFromWarnList } = require('../bdd/warn');
            await removeUserFromWarnList(targetUser);
            
            repondre(`✅ *WARN REMOVED*\n\nWarnings for @${targetUser.split('@')[0]} have been cleared.`);
        } catch (error) {
            console.log("Delwarn error:", error);
            repondre("❌ Error removing warnings!");
        }
    }
};
