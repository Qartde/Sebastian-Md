const { zokou } = require("../framework/zokou");
const { 
  ajouterOuMettreAJourStatusJid, 
  mettreAJourStatusAction, 
  verifierStatusEtatJid, 
  recupererStatusActionJid 
} = require("../bdd/antistatus");
const { getWarnCountByJID, ajouterUtilisateurAvecWarnCount, resetWarnCountByJID } = require("../bdd/warn");
const conf = require("../set");

zokou({
  nomCom: "antistatus",
  aliases: ["antistatusmention", "antistatusmsg", "as"],
  reaction: "📵",
  categorie: "Group"
}, async (dest, zk, commandeOptions) => {
  const { ms, repondre, arg, auteurMessage, idBot, msgRepondu, auteurMsgRepondu } = commandeOptions;
  
  // Only works in groups
  if (!dest.endsWith("@g.us")) {
    return repondre("❌ This command only works in groups.");
  }
  
  try {
    // Get group metadata
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
    
    // ============ TURN ON ANTI-STATUS ============
    if (subCommand === "on") {
      await ajouterOuMettreAJourStatusJid(dest, 'oui');
      
      return zk.sendMessage(dest, {
        text: `╭━━━〔 *ANTI-STATUS MENTION* 〕━━━╮
┃
┃ 📵 *ANTI-STATUS ACTIVATED*
┃
┃ ✅ Status mentions will be detected
┃    and automatically deleted.
┃
┃ ⚙️ *Actions available:*
┃ └─ .antistatus action [delete|warn|remove]
┃
┃ ⚠️ *Note:* Only works for non-admins
┃
╰━━━〔 *POWERED BY SEBASTIAN* 〕━━━╯

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
            body: "📵 Anti-Status Activated",
            thumbnailUrl: "https://files.catbox.moe/2yarwr.png",
            mediaType: 1
          }
        }
      }, { quoted: ms });
    }
    
    // ============ TURN OFF ANTI-STATUS ============
    else if (subCommand === "off") {
      await ajouterOuMettreAJourStatusJid(dest, 'non');
      
      return zk.sendMessage(dest, {
        text: `╭━━━〔 *ANTI-STATUS MENTION* 〕━━━╮
┃
┃ 📵 *ANTI-STATUS DEACTIVATED*
┃
┃ ❌ Status mentions will no longer
┃    be monitored or deleted.
┃
╰━━━〔 *POWERED BY SEBASTIAN* 〕━━━╯

⚡ *SEBASTIAN MD*`,
        contextInfo: {
          externalAdReply: {
            title: "SEBASTIAN MD",
            body: "📵 Anti-Status Deactivated",
            thumbnailUrl: "https://files.catbox.moe/2yarwr.png"
          }
        }
      }, { quoted: ms });
    }
    
    // ============ SET ACTION ============
    else if (subCommand === "action") {
      const action = arg[1]?.toLowerCase();
      
      let dbAction = 'delete';
      let actionDisplay = 'delete only';
      
      if (action === 'delete') {
        dbAction = 'delete';
        actionDisplay = 'delete only';
      } else if (action === 'warn') {
        dbAction = 'warn';
        actionDisplay = 'warn + delete (3-strike rule)';
      } else if (action === 'remove' || action === 'kick') {
        dbAction = 'remove';
        actionDisplay = 'remove immediately';
      } else {
        return repondre("❌ Please specify action: `delete`, `warn`, or `remove`\nExample: `.antistatus action warn`");
      }
      
      await mettreAJourStatusAction(dest, dbAction);
      
      return zk.sendMessage(dest, {
        text: `╭━━━〔 *ANTI-STATUS MENTION* 〕━━━╮
┃
┃ 📵 *ACTION UPDATED*
┃
┃ ✅ Anti-status action set to: *${actionDisplay}*
┃
╰━━━〔 *POWERED BY SEBASTIAN* 〕━━━╯

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
    
    // ============ SHOW SETTINGS ============
    else {
      const etat = await verifierStatusEtatJid(dest);
      const dbAction = await recupererStatusActionJid(dest) || 'delete';
      
      let actionDisplay = 'delete only';
      if (dbAction === 'warn') actionDisplay = 'warn + delete (3-strike)';
      else if (dbAction === 'remove') actionDisplay = 'remove immediately';
      
      const statusText = etat ? "✅ *ON*" : "❌ *OFF*";
      
      return zk.sendMessage(dest, {
        text: `╭━━━〔 *ANTI-STATUS MENTION* 〕━━━╮
┃
┃ 📊 *Status:* ${statusText}
┃ ⚙️ *Action:* ${actionDisplay}
┃
┃ 📝 *Commands:*
┃ └─ .antistatus on              - Enable
┃ └─ .antistatus off             - Disable
┃ └─ .antistatus action [delete|warn|remove]
┃
┃ ⚠️ *Bot must be admin*
┃
╰━━━〔 *POWERED BY SEBASTIAN* 〕━━━╯

⚡ *SEBASTIAN MD*`
      }, { quoted: ms });
    }
    
  } catch (error) {
    console.error("Anti-status command error:", error);
    repondre("❌ Error: " + error.message);
  }
});
