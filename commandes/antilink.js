// commandes/antilinkCmd.js

const { modifierEtatJid, recupererActionJid, modifierActionJid, verifierEtatJid } = require("../bdd/antilien");
const conf = require("../set");

// Command: antilink on/off/status/action
async function antilinkCommand(origineMessage, zk, commandeOptions) {
    const { superUser, verifAdmin, arg, ms, repondre } = commandeOptions;
    
    // Check if it's a group
    if (!origineMessage.endsWith("@g.us")) {
        return repondre("❌ This command can only be used in groups!");
    }
    
    // Check if user is admin or superuser
    if (!verifAdmin && !superUser) {
        return repondre("❌ Only group admins can use this command!");
    }
    
    // Check if arguments provided
    if (!arg || arg.length === 0) {
        // Show current status
        const etat = await verifierEtatJid(origineMessage);
        const action = await recupererActionJid(origineMessage) || 'delete';
        const status = etat ? "✅ ENABLED" : "❌ DISABLED";
        
        return repondre(`╭━━━ *『 ANTI-LINK STATUS 』* ━━━╮
┃
┃ 📌 *Group:* ${origineMessage.split('@')[0]}
┃ 🔰 *Status:* ${status}
┃ ⚙️ *Action:* ${action}
┃
┃ *Commands:*
┃ • ${conf.PREFIXE}antilink on - Enable
┃ • ${conf.PREFIXE}antilink off - Disable
┃ • ${conf.PREFIXE}antilink action [delete|remove|warn]
┃ • ${conf.PREFIXE}antilink status - Show status
┃
╰━━━━━━━━━━━━━━━━━━━━━━━━━━╯`);
    }
    
    const subCommand = arg[0].toLowerCase();
    
    // Handle on/off
    if (subCommand === 'on' || subCommand === 'off') {
        const newEtat = subCommand === 'on';
        await modifierEtatJid(origineMessage, newEtat);
        
        return repondre(`✅ *ANTI-LINK ${newEtat ? 'ENABLED' : 'DISABLED'}* 
        
Anti-link has been ${newEtat ? 'activated' : 'deactivated'} for this group.
${newEtat ? 'All links will now be automatically moderated.' : 'Links are now allowed in this group.'}`);
    }
    
    // Handle action
    if (subCommand === 'action' && arg[1]) {
        const action = arg[1].toLowerCase();
        
        if (!['delete', 'remove', 'warn'].includes(action)) {
            return repondre("❌ Invalid action! Use: delete, remove, or warn");
        }
        
        await modifierActionJid(origineMessage, action);
        
        let actionDescription = '';
        if (action === 'delete') actionDescription = '📝 Links will be deleted and user warned';
        else if (action === 'remove') actionDescription = '🚫 Users will be removed from group';
        else if (action === 'warn') actionDescription = '⚠️ Users will be warned and tracked';
        
        return repondre(`✅ *ANTI-LINK ACTION UPDATED*
        
New action: *${action.toUpperCase()}*
${actionDescription}`);
    }
    
    // Handle status
    if (subCommand === 'status') {
        const etat = await verifierEtatJid(origineMessage);
        const action = await recupererActionJid(origineMessage) || 'delete';
        const status = etat ? "✅ ENABLED" : "❌ DISABLED";
        
        return repondre(`╭━━━ *『 ANTI-LINK STATUS 』* ━━━╮
┃
┃ 📌 *Group:* ${origineMessage.split('@')[0]}
┃ 🔰 *Status:* ${status}
┃ ⚙️ *Action:* ${action}
┃
╰━━━━━━━━━━━━━━━━━━━━━━━━━━╯`);
    }
    
    // Help
    return repondre(`❓ *ANTI-LINK COMMANDS*
        
• ${conf.PREFIXE}antilink on - Enable anti-link
• ${conf.PREFIXE}antilink off - Disable anti-link
• ${conf.PREFIXE}antilink action delete - Just delete links
• ${conf.PREFIXE}antilink action remove - Delete and remove user
• ${conf.PREFIXE}antilink action warn - Delete and warn user
• ${conf.PREFIXE}antilink status - Check current settings`);
}

// Register the command
const commandes = [{
    nomCom: "antilink",
    categorie: "ADMIN",
    reaction: "🛡️"
}];

module.exports = {
    commandes,
    antilinkCommand
};
