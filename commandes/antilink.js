const { zokou } = require("../framework/zokou");
const { changerEtatJid, changerActionJid, verifierEtatJid, recupererActionJid } = require("../bdd/antilien");

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
      return zk.sendMessage(dest, {
        text: `╭━━━〔 *SEBASTIAN MD* 〕━━━╮
┃
┃ 🔗 *ANTI-LINK ACTIVATED*
┃
┃ ✅ Links will be automatically deleted.
┃
┃ 📝 *Default action:* Delete
┃
╰━━━〔 *POWERED BY RAHMANI* 〕━━━╯

⚡ *SEBASTIAN MD*`,
        contextInfo: {
          externalAdReply: {
            title: "SEBASTIAN MD",
            body: "🔗 Anti-Link Activated",
            thumbnailUrl: "https://files.catbox.moe/2yarwr.png"
          }
        }
      }, { quoted: ms });
    }
    else if (subCommand === "off") {
      await changerEtatJid(dest, 'non');
      return zk.sendMessage(dest, {
        text: `╭━━━〔 *SEBASTIAN MD* 〕━━━╮
┃
┃ 🔗 *ANTI-LINK DEACTIVATED*
┃
┃ ❌ Links will no longer be deleted.
┃
╰━━━〔 *POWERED BY RAHMANI* 〕━━━╯

⚡ *SEBASTIAN MD*`,
        contextInfo: {
          externalAdReply: {
            title: "SEBASTIAN MD",
            body: "🔗 Anti-Link Deactivated",
            thumbnailUrl: "https://files.catbox.moe/2yarwr.png"
          }
        }
      }, { quoted: ms });
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
      return zk.sendMessage(dest, {
        text: `╭━━━〔 *SEBASTIAN MD* 〕━━━╮
┃
┃ 🔗 *ANTI-LINK SETTINGS*
┃
┃ 📊 *Status:* ${etat}
┃ ⚙️ *Action:* ${action}
┃
┃ 📝 *Commands:*
┃ └─ .antilink on          - Enable
┃ └─ .antilink off         - Disable
┃ └─ .antilink action [delete/warn/remove]
┃
╰━━━〔 *POWERED BY RAHMANI* 〕━━━╯

⚡ *SEBASTIAN MD*`
      }, { quoted: ms });
    }
    
  } catch (error) {
    console.error("Anti-link command error:", error);
    repondre("❌ Error: " + error.message);
  }
});
