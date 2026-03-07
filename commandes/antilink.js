// commandes/antilink.js
const zokou = require("../framework/zokou");

zokou({
    nomCom: "antilink2",
    categorie: "Admin",
    reaction: "🚫",
    desc: "Manage antilink feature in groups"
}, async (origineMessage, zk, commandeOptions) => {
    const { 
        verifAdmin, 
        superUser, 
        arg, 
        repondre, 
        verifGroupe
    } = commandeOptions;
    
    // Check if it's a group
    if (!verifGroupe) {
        repondre('❌ This command only works in groups!');
        return;
    }
    
    // Check if user is admin
    if (!verifAdmin && !superUser) {
        repondre('❌ This command is for admins only!');
        return;
    }
    
    try {
        const { ajouterOuMettreAJourJid, mettreAJourAction, verifierEtatJid, recupererActionJid } = require('../bdd/antilien');
        
        // No arguments - show status
        if (!arg || arg.length === 0) {
            const enabled = await verifierEtatJid(origineMessage);
            const action = await recupererActionJid(origineMessage);
            
            repondre(`📊 *ANTILINK STATUS*\n\n` +
                     `Status: ${enabled ? '✅ ENABLED' : '❌ DISABLED'}\n` +
                     `Action: *${action}*\n\n` +
                     `*Commands:*\n` +
                     `• .antilink on [action]\n` +
                     `• .antilink off\n` +
                     `• .antilink set delete\n` +
                     `• .antilink set remove\n` +
                     `• .antilink set warn`);
            return;
        }
        
        // Handle different arguments
        if (arg[0] === 'on') {
            // Enable antilink
            if (arg[1] && ['delete', 'remove', 'warn'].includes(arg[1])) {
                await mettreAJourAction(origineMessage, arg[1]);
            }
            await ajouterOuMettreAJourJid(origineMessage, 'oui');
            
            const action = arg[1] || await recupererActionJid(origineMessage);
            repondre(`✅ *ANTILINK ENABLED*\n\n` +
                     `Status: ✅ ACTIVE\n` +
                     `Action: *${action}*\n` +
                     `Group: Protected\n\n` +
                     `Links will be managed automatically.`);
            
        } else if (arg[0] === 'off') {
            // Disable antilink
            await ajouterOuMettreAJourJid(origineMessage, 'non');
            repondre(`❌ *ANTILINK DISABLED*\n\n` +
                     `Status: ❌ INACTIVE\n` +
                     `Group: No longer protected\n\n` +
                     `Links are now allowed.`);
            
        } else if (arg[0] === 'set' && arg[1]) {
            const action = arg[1];
            if (['delete', 'remove', 'warn'].includes(action)) {
                await mettreAJourAction(origineMessage, action);
                repondre(`✅ *ANTILINK ACTION UPDATED*\n\n` +
                         `New Action: *${action}*\n` +
                         `Status: ${action === 'delete' ? '🚫 Delete only' : action === 'remove' ? '👢 Remove user' : '⚠️ Warning system'}`);
            } else {
                repondre('❌ Invalid action. Use: delete, remove, or warn');
            }
            
        } else {
            repondre(`*ANTILINK COMMANDS*\n\n` +
                     `.antilink - Show status\n` +
                     `.antilink on [action] - Enable antilink\n` +
                     `.antilink off - Disable antilink\n` +
                     `.antilink set delete - Delete only\n` +
                     `.antilink set remove - Remove user\n` +
                     `.antilink set warn - Warn system`);
        }
    } catch (error) {
        console.log("Antilink command error:", error);
        repondre("❌ Error executing command. Check logs.");
    }
});
