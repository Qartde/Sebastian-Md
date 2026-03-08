const { zokou } = require("../framework/zokou");

if (!global.antiLinkGroups) global.antiLinkGroups = new Map();
if (!global.antiLinkWarns) global.antiLinkWarns = new Map();

/*
  COMMAND: .antilink on/off
*/
zokou({
    nomCom: "antilink",
    categorie: "Group",
    onlyGroup: true,
    reaction: "🔗"
}, async (dest, zk, options) => {

    const { arg, repondre, verifAdmin, superUser, prefixe } = options;

    // Allow only admins or bot owner
    if (!verifAdmin && !superUser) {
        return repondre("❌ This command is for group admins only.");
    }

    const action = arg[0] ? arg[0].toLowerCase() : "";

    if (action === "on") {
        global.antiLinkGroups.set(dest, true);
        return repondre("✅ Anti-link has been enabled in this group.");
    }

    if (action === "off") {
        global.antiLinkGroups.set(dest, false);
        return repondre("⚠️ Anti-link has been disabled in this group.");
    }

    const status = global.antiLinkGroups.get(dest) ? "ON" : "OFF";
    repondre(`ℹ️ Anti-link status: ${status}\nUse ${prefixe}antilink on/off`);
});


/*
  AUTO LINK DETECTOR
*/
zokou({
    nomCom: "antilink-detector",
    categorie: "hidden"
}, async (dest, zk, options) => {

    const { ms, auteurMessage