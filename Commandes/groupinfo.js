const { zokou } = require("../framework/zokou");

zokou({
    nomCom: "groupinfo",
    categorie: "Group"
}, async (dest, zk, commandeOptions) => {

    const { repondre, verifGroupe } = commandeOptions;

    if (!verifGroupe) 
        return repondre("This command works only in groups.");

    try {

        let metadata = await zk.groupMetadata(dest);

        let groupName = metadata.subject;
        let groupId = metadata.id;
        let members = metadata.participants.length;
        let admins = metadata.participants.filter(p => p.admin !== null).length;
        let description = metadata.desc || "No description";
        let owner = metadata.owner || "Unknown";

        let text = `
╭───〔 GROUP INFO 〕───⬣
│
│ 📛 Name: ${groupName}
│ 🆔 ID: ${groupId}
│ 👥 Members: ${members}
│ 👮 Admins: ${admins}
│ 👑 Owner: ${owner}
│ 📝 Description: ${description}
│
╰────────────────⬣
`;

        await zk.sendMessage(dest, { text }, { quoted: commandeOptions.ms });

    } catch (err) {
        console.log(err);
        repondre("Failed to fetch group info.");
    }

});