const { zokou } = require("../framework/zokou");

zokou({
  nomCom: "antidelete",
  aliases: ["antidel", "ad"],
  reaction: "🗑️",
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
    
    // Anti-delete is global, not per group. But we'll store per group for flexibility
    global.antidelete = global.antidelete || {};
    
    const action = arg[0]?.toLowerCase();
    
    if (action === "on") {
      global.antidelete[dest] = { enabled: true };
      return zk.sendMessage(dest, {
        text: `╭━━━〔 *SEBASTIAN MD* 〕━━━╮
┃
┃ 🗑️ *ANTI-DELETE ACTIVATED*
┃
┃ ✅ Deleted messages will be sent
┃    to the owner.
┃
╰━━━〔 *POWERED BY RAHMANI* 〕━━━╯

⚡ *SEBASTIAN MD*`,
        contextInfo: {
          externalAdReply: {
            title: "SEBASTIAN MD",
            body: "🗑️ Anti-Delete Activated",
            thumbnailUrl: "https://files.catbox.moe/2yarwr.png"
          }
        }
      }, { quoted: ms });
    }
    else if (action === "off") {
      global.antidelete[dest] = { enabled: false };
      return zk.sendMessage(dest, {
        text: `╭━━━〔 *SEBASTIAN MD* 〕━━━╮
┃
┃ 🗑️ *ANTI-DELETE DEACTIVATED*
┃
┃ ❌ Deleted messages will no longer
┃    be sent to owner.
┃
╰━━━〔 *POWERED BY RAHMANI* 〕━━━╯

⚡ *SEBASTIAN MD*`,
        contextInfo: {
          externalAdReply: {
            title: "SEBASTIAN MD",
            body: "🗑️ Anti-Delete Deactivated",
            thumbnailUrl: "https://files.catbox.moe/2yarwr.png"
          }
        }
      }, { quoted: ms });
    }
    else {
      const status = global.antidelete[dest]?.enabled ? "✅ *ON*" : "❌ *OFF*";
      return zk.sendMessage(dest, {
        text: `╭━━━〔 *SEBASTIAN MD* 〕━━━╮
┃
┃ 🗑️ *ANTI-DELETE SETTINGS*
┃
┃ 📊 *Status:* ${status}
┃
┃ 📝 *Commands:*
┃ └─ .antidelete on  - Enable
┃ └─ .antidelete off - Disable
┃
╰━━━〔 *POWERED BY RAHMANI* 〕━━━╯

⚡ *SEBASTIAN MD*`
      }, { quoted: ms });
    }
    
  } catch (error) {
    console.error("Anti-delete command error:", error);
    repondre("❌ Error: " + error.message);
  }
});
