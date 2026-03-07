// Command: .antilink on/off
if (com === 'antilink') {
    if (!verifAdmin && !superUser) {
        repondre('❌ This command is for admins only!');
        return;
    }
    
    const { ajouterOuMettreAJourJid, mettreAJourAction } = require('./bdd/antilien');
    
    if (arg[0] === 'on') {
        // Set action if provided, otherwise keep existing
        if (arg[1]) {
            await mettreAJourAction(origineMessage, arg[1]);
        }
        await ajouterOuMettreAJourJid(origineMessage, 'oui');
        repondre('✅ *Antilink Enabled*\n\nLinks will be managed automatically.');
        
    } else if (arg[0] === 'off') {
        await ajouterOuMettreAJourJid(origineMessage, 'non');
        repondre('❌ *Antilink Disabled*');
        
    } else if (arg[0] === 'set' && arg[1]) {
        const action = arg[1];
        if (['delete', 'remove', 'warn'].includes(action)) {
            await mettreAJourAction(origineMessage, action);
            repondre(`✅ *Antilink Action Updated*\n\nAction: *${action}*`);
        } else {
            repondre('❌ Invalid action. Use: delete, remove, or warn');
        }
        
    } else {
        repondre(`*Antilink Commands:*\n\n` +
                 `.antilink on [action] - Enable antilink\n` +
                 `.antilink off - Disable antilink\n` +
                 `.antilink set delete - Delete only\n` +
                 `.antilink set remove - Remove user\n` +
                 `.antilink set warn - Warn system`);
    }
}
