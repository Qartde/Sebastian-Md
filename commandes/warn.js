const { zokou } = require("../framework/zokou");
const { getWarnCountByJID, ajouterUtilisateurAvecWarnCount, resetWarnCountByJID } = require("../bdd/warn");

zokou({
  nomCom: "warn",
  aliases: ["warning"],
  reaction: "⚠️",
  categorie: "Group"
}, async (dest, zk, commandeOptions) => {
  const { ms, repondre, arg, auteurMessage, msgRepondu, auteurMsgRepondu, superUser } = commandeOptions;
  
  if (!dest.endsWith("@g.us")) {
    return repondre("❌ This command only works in groups.");
  }
  
  try {
    const groupMetadata = await zk.groupMetadata(dest);
    const participants = groupMetadata.participants;
    const isAdmin = participants.some(p => p.id === auteurMessage && (p.admin === 'admin' || p.admin === 'superadmin'));
    
    if (!isAdmin && !superUser) {
      return repondre("❌ Only group admins can use this command.");
    }
    
    const subCommand = arg[0]?.toLowerCase();
    
    // Get target user
    let targetJid = null;
    if (msgRepondu && auteurMsgRepondu) {
      targetJid = auteurMsgRepondu;
    } else if (arg[0] && arg[0].includes('@')) {
      targetJid = arg[0].replace('@', '') + '@s.whatsapp.net';
    }
    
    if (subCommand === "reset") {
      if (!targetJid) {
        return repondre("❌ Please reply to a user or mention them to reset warns.");
      }
      await resetWarnCountByJID(targetJid);
      return zk.sendMessage(dest, {
        text: `✅ *Warnings reset for* @${targetJid.split('@')[0]}`,
        mentions: [targetJid]
      }, { quoted: ms });
    }
    else if (subCommand === "check") {
      if (!targetJid) {
        // Check self if no target
        targetJid = auteurMessage;
      }
      const warnCount = await getWarnCountByJID(targetJid) || 0;
      const warnLimit = conf.WARN_COUNT || 3;
      return zk.sendMessage(dest, {
        text: `⚠️ *WARN CHECK*\n\n👤 User: @${targetJid.split('@')[0]}\n📊 Warnings: ${warnCount}/${warnLimit}`,
        mentions: [targetJid]
      }, { quoted: ms });
    }
    else {
      if (!targetJid) {
        return repondre("❌ Please reply to a user or mention them to warn.\n\nCommands:\n.warn @user - Add warning\n.warn reset @user - Reset warnings\n.warn check @user - Check warnings");
      }
      
      const warnCount = await getWarnCountByJID(targetJid) || 0;
      const warnLimit = conf.WARN_COUNT || 3;
      
      if (warnCount >= warnLimit) {
        // Auto-kick if over limit
        await zk.groupParticipantsUpdate(dest, [targetJid], "remove");
        await resetWarnCountByJID(targetJid);
        return zk.sendMessage(dest, {
          text: `⚠️ @${targetJid.split('@')[0]} has been removed for exceeding warn limit (${warnLimit}).`,
          mentions: [targetJid]
        }, { quoted: ms });
      } else {
        await ajouterUtilisateurAvecWarnCount(targetJid);
        const newCount = warnCount + 1;
        const remaining = warnLimit - newCount;
        return zk.sendMessage(dest, {
          text: `⚠️ @${targetJid.split('@')[0]} has been warned!\n\n📊 Warnings: ${newCount}/${warnLimit}\n⚠️ Remaining: ${remaining}`,
          mentions: [targetJid]
        }, { quoted: ms });
      }
    }
    
  } catch (error) {
    console.error("Warn command error:", error);
    repondre("❌ Error: " + error.message);
  }
});
