const { zokou } = require("../framework/zokou");

// Anti-tag settings stored in memory (global variable from index.js)
global.antitag = global.antitag || {};

zokou({
  nomCom: "antitag",
  aliases: ["autodelete", "deletetag"],
  reaction: "🚫",
  categorie: "Group"
}, async (dest, zk, commandeOptions) => {
  const { ms, repondre, arg, auteurMessage, idBot } = commandeOptions;
  
  // Only group chats
  if (!dest.endsWith("@g.us")) {
    return repondre("❌ This command only works in groups.");
  }
  
  try {
    // Check if user is admin
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
    
    // Get action from argument
    const action = arg[0]?.toLowerCase();
    
    // Initialize setting for this group
    if (!global.antitag[dest]) {
      global.antitag[dest] = { enabled: false };
    }
    
    if (action === "on") {
      global.antitag[dest].enabled = true;
      return zk.sendMessage(dest, {
        text: `╭━━━〔 *sᴇʙᴀsᴛɪᴀɴ ᴍᴅ* 〕━━━╮
┃
┃ 🚫 *ANTI-TAG ACTIVATED*
┃
┃ ✅ Messages that tag members
┃    will be automatically deleted.
┃
┃ ⚠️ *Note:* Only works for non-admins
┃
╰━━━〔 *ᴘᴏᴡᴇʀᴇᴅ ʙʏ ʀᴀʜᴍᴀɴɪ* 〕━━━╯

⚡ *sᴇʙᴀsᴛɪᴀɴ ᴍᴅ*`,
        contextInfo: {
          isForwarded: true,
          forwardedNewsletterMessageInfo: {
            newsletterJid: "120363406436673870@newsletter",
            newsletterName: "sᴇʙᴀsᴛɪᴀɴ ᴍᴅ",
            serverMessageId: 143
          },
          externalAdReply: {
            title: "sᴇʙᴀsᴛɪᴀɴ ᴍᴅ",
            body: "🚫 Anti-Tag Activated",
            thumbnailUrl: "https://files.catbox.moe/2yarwr.png",
            mediaType: 1
          }
        }
      }, { quoted: ms });
    } 
    else if (action === "off") {
      global.antitag[dest].enabled = false;
      return zk.sendMessage(dest, {
        text: `╭━━━〔 *sᴇʙᴀsᴛɪᴀɴ ᴍᴅ* 〕━━━╮
┃
┃ 🚫 *ANTI-TAG DEACTIVATED*
┃
┃ ❌ Tag messages will no longer
┃    be automatically deleted.
┃
╰━━━〔 *ᴘᴏᴡᴇʀᴇᴅ ʙʏ ʀᴀʜᴍᴀɴɪ* 〕━━━╯

⚡ *sᴇʙᴀsᴛɪᴀɴ ᴍᴅ*`,
        contextInfo: {
          externalAdReply: {
            title: "sᴇʙᴀsᴛɪᴀɴ ᴍᴅ",
            body: "🚫 Anti-Tag Deactivated",
            thumbnailUrl: "https://files.catbox.moe/2yarwr.png"
          }
        }
      }, { quoted: ms });
    }
    else {
      const status = global.antitag[dest]?.enabled ? "✅ *ON*" : "❌ *OFF*";
      return zk.sendMessage(dest, {
        text: `╭━━━〔 *sᴇʙᴀsᴛɪᴀɴ ᴍᴅ* 〕━━━╮
┃
┃ 🚫 *ANTI-TAG SETTINGS*
┃
┃ 📊 *Status:* ${status}
┃
┃ 📝 *Commands:*
┃ └─ .antitag on  - Enable
┃ └─ .antitag off - Disable
┃
┃ ⚠️ *Bot must be admin*
┃
╰━━━〔 *ᴘᴏᴡᴇʀᴇᴅ ʙʏ ʀᴀʜᴍᴀɴɪ* 〕━━━╯

⚡ *sᴇʙᴀsᴛɪᴀɴ ᴍᴅ*`
      }, { quoted: ms });
    }
    
  } catch (error) {
    console.error("Anti-tag command error:", error);
    repondre("❌ Error: " + error.message);
  }
});
