const { zokou } = require("../framework/zokou");
const { verifierEtatJid, recupererActionJid, changerEtatJid, changerActionJid } = require("../bdd/antilien");

zokou({
  nomCom: "antilink",
  aliases: ["antilien", "antiurl"],
  reaction: "🔗",
  categorie: "Group"
}, async (dest, zk, commandeOptions) => {
  const { ms, repondre, arg, auteurMessage, idBot } = commandeOptions;
  
  if (!dest.endsWith("@g.us")) {
    return repondre("❌ This command only works in groups.");
  }
  
  try {
    const groupMetadata = await zk.groupMetadata(dest);
    const participants = groupMetadata.participants;
    const isAdmin = participants.some(p => p.id === auteurMessage && (p.admin === 'admin' || p.admin === 'superadmin'));
    
    if (!isAdmin) {
      return repondre("❌ Only group admins can use this command.");
    }
    
    const subCommand = arg[0]?.toLowerCase();
    
    if (subCommand === "on") {
      await changerEtatJid(dest, 'oui');
      await changerActionJid(dest, 'delete'); // default action
      return repondre("✅ *Anti-link activated!*\nDefault action: delete");
    }
    else if (subCommand === "off") {
      await changerEtatJid(dest, 'non');
      return repondre("❌ *Anti-link deactivated!*");
    }
    else if (subCommand === "action") {
      const action = arg[1]?.toLowerCase();
      if (!action || !['delete', 'warn', 'remove'].includes(action)) {
        return repondre("❌ Please specify action: delete, warn, or remove\nExample: .antilink action delete");
      }
      await changerActionJid(dest, action);
      return repondre(`✅ Anti-link action set to: *${action}*`);
    }
    else {
      const etat = await verifierEtatJid(dest) ? "✅ *ON*" : "❌ *OFF*";
      const action = await recupererActionJid(dest) || 'delete';
      return repondre(`🔗 *ANTI-LINK SETTINGS*\n\n📊 Status: ${etat}\n⚙️ Action: ${action}\n\nCommands:\n.antilink on\n.antilink off\n.antilink action [delete/warn/remove]`);
    }
    
  } catch (error) {
    console.error("Anti-link command error:", error);
    repondre("❌ Error: " + error.message);
  }
});
