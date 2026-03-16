const zokou = require("../framework/zokou");
const { 
    mettreAJourAction,
    ajouterOuMettreAJourJid,
    verifierEtatJid,
    recupererActionJid
} = require("../bdd/antilien");
const { getWarnCountByJID } = require('../bdd/warn');

zokou({
    nomCom: "antilink",
    categorie: "Admin",
    reaction: "🔗",
    fonction: async (origineMessage, zk, options) => {
        
        const { repondre, arg, verifAdmin, superUser, verifGroupe, ms, auteurMsgRepondu, msgRepondu } = options;
        
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

        // ===== SHOW STATUS (no arguments) =====
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
                statusMsg += `┃ • ,antilink action delete - Delete only\n`;
                statusMsg += `┃ • ,antilink action remove - Remove user\n`;
                statusMsg += `┃ • ,antilink action warn - Warn user\n`;
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
        if (subCommand === 'on' || subCommand === 'enable') {
            try {
                await ajouterOuMettreAJourJid(origineMessage, 'oui');
                const action = await recupererActionJid(origineMessage);
                repondre(`✅ *ANTI-LINK ACTIVATED*\n\n📌 Group: ${origineMessage.split('@')[0]}\n🎯 Action: ${action.toUpperCase()}\n\nLinks will now be monitored!`);
            } catch (error) {
                console.log("Antilink on error:", error);
                repondre("❌ Failed to activate antilink!");
            }
        }

        // ===== TURN OFF =====
        else if (subCommand === 'off' || subCommand === 'disable') {
            try {
                await ajouterOuMettreAJourJid(origineMessage, 'non');
                repondre(`❌ *ANTI-LINK DEACTIVATED*\n\nLinks are now allowed in this group.`);
            } catch (error) {
                console.log("Antilink off error:", error);
                repondre("❌ Failed to deactivate antilink!");
            }
        }

        // ===== SET ACTION =====
        else if (subCommand === 'action') {
            if (arg.length < 2) {
                const currentAction = await recupererActionJid(origineMessage);
                repondre(`🎯 *Current Action:* ${currentAction.toUpperCase()}\n\nAvailable actions:\n• delete - Delete message only\n• remove - Remove user from group\n• warn - Give warning points\n\nUsage: ,antilink action [delete/remove/warn]`);
                return;
            }

            const action = arg[1].toLowerCase();
            
            // Map user-friendly names to database values
            let dbAction;
            if (action === 'delete') dbAction = 'supp';
            else if (action === 'remove') dbAction = 'remove';
            else if (action === 'warn') dbAction = 'warn';
            else {
                repondre("❌ Invalid action! Choose: delete, remove, or warn");
                return;
            }

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
        else if (subCommand === 'help') {
            const helpMsg = `╭━━━ *『 ANTI-LINK HELP 』* ━━━╮
┃
┃ *Commands:*
┃
┃ 🔹 *Activate:* ,antilink on
┃ 🔹 *Deactivate:* ,antilink off
┃ 🔹 *Set Action:* ,antilink action [delete/remove/warn]
┃ 🔹 *Check Status:* ,antilink
┃ 🔹 *Check Warns:* ,warn @user
┃
┃ *Actions:*
┃ • delete - Delete message only
┃ • remove - Remove user from group
┃ • warn - Give warning points
┃
╰━━━━━━━━━━━━━━━━━━━━━━━━━━╯`;
            repondre(helpMsg);
        }

        // ===== UNKNOWN =====
        else {
            repondre(`❌ Unknown command: ${subCommand}\n\nUse ,antilink help to see available commands.`);
        }
    }
});
