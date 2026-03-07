// commandes/antilink.js
const evt = require("../framework/zokou");

evt({
    nomCom: "antilink",
    categorie: "Admin",
    reaction: "🚫",
    desc: "Manage antilink feature in groups"
}, async (origineMessage, zk, commandeOptions) => {
    const { 
        verifAdmin, 
        superUser, 
        arg, 
        repondre, 
        origineMessage: groupId 
    } = commandeOptions;
    
    // Check if user is admin
    if (!verifAdmin && !superUser) {
        repondre('❌ This command is for admins only!');
        return;
    }
    
    // Check if it's a group
    if (!groupId.endsWith('@g.us')) {
        repondre('❌ This command only works in groups!');
        return;
    }
    
    const { ajouterOuMettreAJourJid, mettreAJourAction } = require('../bdd/antilien');
    
    if (!arg || arg.length === 0) {
        // Show current status
        const { verifierEtatJid, recupererActionJid } = require('../bdd/antilien');
        const enabled = await verifierEtatJid(groupId);
        const action = await recupererActionJid(groupId);
        
        repondre(`📊 *Antilink Status*\n\n` +
                 `Status: ${enabled ? '✅ Enabled' : '❌ Disabled'}\n` +
                 `Action: *${action}*\n\n` +
                 `Use: .antilink on/off/set`);
        return;
    }
    
    if (arg[0] === 'on') {
        // Enable antilink
        if (arg[1] && ['delete', 'remove', 'warn'].includes(arg[1])) {
            await mettreAJourAction(groupId, arg[1]);
        }
        await ajouterOuMettreAJourJid(groupId, 'oui');
        repondre('✅ *Antilink Enabled*\n\nLinks will be managed automatically.');
        
    } else if (arg[0] === 'off') {
        await ajouterOuMettreAJourJid(groupId, 'non');
        repondre('❌ *Antilink Disabled*');
        
    } else if (arg[0] === 'set' && arg[1]) {
        const action = arg[1];
        if (['delete', 'remove', 'warn'].includes(action)) {
            await mettreAJourAction(groupId, action);
            repondre(`✅ *Antilink Action Updated*\n\nAction: *${action}*`);
        } else {
            repondre('❌ Invalid action. Use: delete, remove, or warn');
        }
        
    } else {
        repondre(`*Antilink Commands:*\n\n` +
                 `.antilink - Show status\n` +
                 `.antilink on [action] - Enable antilink\n` +
                 `.antilink off - Disable antilink\n` +
                 `.antilink set delete - Delete only\n` +
                 `.antilink set remove - Remove user\n` +
                 `.antilink set warn - Warn system`);
    }
});
