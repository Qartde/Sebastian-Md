const { zokou } = require("../framework/zokou");
const { verifierEtatJid, recupererActionJid, mettreAJourAction, ajouterOuMettreAJourJid } = require("../bdd/antilien");

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
    const isBotAdmin = participants.some(p => p.id === idBot && (p.admin === 'admin' || p.admin === 'superadmin'));
    
    if (!isAdmin) {
      return repondre("❌ Only group admins can use this command.");
    }
    
    if (!isBotAdmin) {
      return repondre("❌ Bot must be admin to delete messages.");
    }
    
    const subCommand = arg[0]?.toLowerCase();
    
    // KUWASHA ANTI-LINK
    if (subCommand === "on") {
      await ajouterOuMettreAJourJid(dest, 'oui');
      return zk.sendMessage(dest, {
        text: `╭━━━〔 *SEBASTIAN MD* 〕━━━╮
┃
┃ 🔗 *ANTI-LINK ACTIVATED*
┃
┃ ✅ Links will be automatically deleted.
┃
┃ ⚙️ *Default action:* Delete
┃
╰━━━〔 *POWERED BY RAHMANI* 〕━━━╯

⚡ *SEBASTIAN MD*`,
        contextInfo: {
          isForwarded: true,
          forwardedNewsletterMessageInfo: {
            newsletterJid: "120363406436673870@newsletter",
            newsletterName: "SEBASTIAN MD",
            serverMessageId: 143
          },
          externalAdReply: {
            title: "SEBASTIAN MD",
            body: "🔗 Anti-Link Activated",
            thumbnailUrl: "https://files.catbox.moe/2yarwr.png",
            mediaType: 1
          }
        }
      }, { quoted: ms });
    }
    
    // KUZIMA ANTI-LINK
    else if (subCommand === "off") {
      await ajouterOuMettreAJourJid(dest, 'non');
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
    
    // KUBADILISHA ACTION
    else if (subCommand === "action") {
      const action = arg[1]?.toLowerCase();
      
      // Tafsiri action kwa lugha ya database yako (Kifaransa)
      let dbAction = 'supp'; // default delete
      let actionDisplay = 'delete';
      
      if (action === 'delete') {
        dbAction = 'supp';
        actionDisplay = 'delete';
      } else if (action === 'warn') {
        dbAction = 'warn';
        actionDisplay = 'warn';
      } else if (action === 'remove' || action === 'kick') {
        dbAction = 'remove';
        actionDisplay = 'remove';
      } else {
        return repondre("❌ Please specify action: `delete`, `warn`, or `remove`\nExample: `.antilink action delete`");
      }
      
      await mettreAJourAction(dest, dbAction);
      
      return zk.sendMessage(dest, {
        text: `╭━━━〔 *SEBASTIAN MD* 〕━━━╮
┃
┃ 🔗 *ACTION UPDATED*
┃
┃ ✅ Anti-link action set to: *${actionDisplay}*
┃
╰━━━〔 *POWERED BY RAHMANI* 〕━━━╯

⚡ *SEBASTIAN MD*`,
        contextInfo: {
          externalAdReply: {
            title: "SEBASTIAN MD",
            body: `Action: ${actionDisplay}`,
            thumbnailUrl: "https://files.catbox.moe/2yarwr.png"
          }
        }
      }, { quoted: ms });
    }
    
    // KUANGALIA HALI (default)
    else {
      const etat = await verifierEtatJid(dest);
      const dbAction = await recupererActionJid(dest);
      
      // Tafsiri action kutoka database
      let actionDisplay = 'delete';
      if (dbAction === 'supp') actionDisplay = 'delete';
      else if (dbAction === 'warn') actionDisplay = 'warn';
      else if (dbAction === 'remove') actionDisplay = 'remove';
      
      const statusText = etat ? "✅ *ON*" : "❌ *OFF*";
      
      return zk.sendMessage(dest, {
        text: `╭━━━〔 *SEBASTIAN MD* 〕━━━╮
┃
┃ 🔗 *ANTI-LINK SETTINGS*
┃
┃ 📊 *Status:* ${statusText}
┃ ⚙️ *Action:* ${actionDisplay}
┃
┃ 📝 *Commands:*
┃ └─ .antilink on           - Enable
┃ └─ .antilink off          - Disable
┃ └─ .antilink action [delete/warn/remove]
┃
┃ ⚠️ *Bot must be admin*
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
