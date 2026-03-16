const zokou = require("../framework/zokou");
const { 
    verifierEtatJid, 
    recupererActionJid,
    ajouterOuMettreAJourJid,
    mettreAJourAction
} = require("../bdd/antilien");

zokou({
    nomCom: "antilink",
    categorie: "Admin",
    reaction: "🔗",
    fonction: async (origineMessage, zk, options) => {
        
        const { repondre, arg, verifAdmin, superUser, verifGroupe } = options;
        
        // RUDISHA UIOWEKE KWA AJILI YA DEBUG
        console.log("========== ANTILINK COMMAND EXECUTED ==========");
        console.log("Group:", verifGroupe);
        console.log("Admin:", verifAdmin);
        console.log("SuperUser:", superUser);
        console.log("Arguments:", arg);
        
        if (!verifGroupe) {
            repondre("❌ Command hii inatumika kwenye group pekee!");
            return;
        }

        if (!verifAdmin && !superUser) {
            repondre("❌ Command hii ni ya admins pekee!");
            return;
        }

        // HAKUNA ARGUMENTS - ONYESHA STATUS
        if (!arg || arg.length === 0) {
            try {
                const etat = await verifierEtatJid(origineMessage);
                const action = await recupererActionJid(origineMessage);
                
                let status = etat ? "✅ IMEWASHWA" : "❌ IMEZIMWA";
                let act = action === 'supp' ? 'FUTA' : action === 'remove' ? 'TOA' : 'ONYA';
                
                repondre(`*⚙️ ANTI-LINK STATUS*
                
📌 Group: ${origineMessage.split('@')[0]}
⚡ Hali: ${status}
🎯 Action: ${act}

*Commands:*
• ,antilink on - Washa
• ,antilink off - Zima
• ,antilink action delete - Futa tu
• ,antilink action remove - Toa member
• ,antilink action warn - Onya
• ,antilink status - Angalia tena`);
                
            } catch (e) {
                console.log("Error:", e);
                repondre("❌ Error: " + e.message);
            }
            return;
        }

        const cmd = arg[0].toLowerCase();

        // WASHA
        if (cmd === 'on') {
            try {
                await ajouterOuMettreAJourJid(origineMessage, 'oui');
                repondre("✅ *ANTI-LINK IMEWASHWA*");
            } catch (e) {
                repondre("❌ Error: " + e.message);
            }
        }
        
        // ZIMA
        else if (cmd === 'off') {
            try {
                await ajouterOuMettreAJourJid(origineMessage, 'non');
                repondre("❌ *ANTI-LINK IMEZIMWA*");
            } catch (e) {
                repondre("❌ Error: " + e.message);
            }
        }
        
        // BADILISHA ACTION
        else if (cmd === 'action') {
            if (arg.length < 2) {
                repondre("Tafadhali chagua: delete, remove, au warn");
                return;
            }
            
            const action = arg[1].toLowerCase();
            let dbAction = 'supp';
            
            if (action === 'delete') dbAction = 'supp';
            else if (action === 'remove') dbAction = 'remove';
            else if (action === 'warn') dbAction = 'warn';
            else {
                repondre("Action si sahihi. Tumia: delete, remove, au warn");
                return;
            }
            
            try {
                await mettreAJourAction(origineMessage, dbAction);
                repondre(`✅ Action imebadilishwa kuwa: *${action.toUpperCase()}*`);
            } catch (e) {
                repondre("❌ Error: " + e.message);
            }
        }
        
        // STATUS
        else if (cmd === 'status') {
            try {
                const etat = await verifierEtatJid(origineMessage);
                const action = await recupererActionJid(origineMessage);
                
                let status = etat ? "✅ IMEWASHWA" : "❌ IMEZIMWA";
                let act = action === 'supp' ? 'FUTA' : action === 'remove' ? 'TOA' : 'ONYA';
                
                repondre(`*⚙️ ANTI-LINK STATUS*
                
📌 Group: ${origineMessage.split('@')[0]}
⚡ Hali: ${status}
🎯 Action: ${act}`);
                
            } catch (e) {
                repondre("❌ Error: " + e.message);
            }
        }
        
        // HELP
        else if (cmd === 'help') {
            repondre(`*🔗 ANTI-LINK HELP*

,antilink - Angalia status
,antilink on - Washa
,antilink off - Zima
,antilink action delete - Futa tu
,antilink action remove - Toa member
,antilink action warn - Onya
,antilink status - Angalia status`);
        }
        
        else {
            repondre("Command haitambuliki. Tuma ,antilink help");
        }
    }
});
