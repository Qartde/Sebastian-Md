"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });

const baileys_1 = __importStar(require("@whiskeysockets/baileys"));
const logger_1 = __importDefault(require("@whiskeysockets/baileys/lib/Utils/logger"));
const logger = logger_1.default.child({});
logger.level = 'silent';
const pino = require("pino");
const boom_1 = require("@hapi/boom");
const conf = require("./set");
const axios = require("axios");
let fs = require("fs-extra");
let path = require("path");
const FileType = require('file-type');
const { Sticker, createSticker, StickerTypes } = require('wa-sticker-formatter');

// BDD imports
const { verifierEtatJid, recupererActionJid } = require("./bdd/antilien");
const { atbverifierEtatJid, atbrecupererActionJid } = require("./bdd/antibot");
let evt = require(__dirname + "/framework/zokou");
const { isUserBanned, addUserToBanList, removeUserFromBanList } = require("./bdd/banUser");
const { addGroupToBanList, isGroupBanned, removeGroupFromBanList } = require("./bdd/banGroup");
const { isGroupOnlyAdmin, addGroupToOnlyAdminList, removeGroupFromOnlyAdminList } = require("./bdd/onlyAdmin");
let { reagir } = require(__dirname + "/framework/app");
var session = conf.session.replace(/Zokou-MD-WHATSAPP-BOT;;;=>/g, "");
const prefixe = conf.PREFIXE;
const more = String.fromCharCode(8206);
const readmore = more.repeat(4001);

// Global variable for reaction rate limiting
global.lastReactionTime = 0;

// Message store for anti-delete
const messageStore = {};

async function authentification() {
    try {
        if (!fs.existsSync(__dirname + "/auth/creds.json")) {
            console.log("connexion en cour ...");
            await fs.writeFile(__dirname + "/auth/creds.json", Buffer.from(session, "base64").toString("utf-8"), "utf8");
        } else if (fs.existsSync(__dirname + "/auth/creds.json") && session != "zokk") {
            await fs.writeFile(__dirname + "/auth/creds.json", Buffer.from(session, "base64").toString("utf-8"), "utf8");
        }
    } catch (e) {
        console.log("Session Invalid " + e);
        return;
    }
}
authentification();

// Group metadata cache
const groupMetadataCache = {};
const GROUP_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function getGroupMetadata(zk, groupId) {
    const now = Date.now();
    const cached = groupMetadataCache[groupId];
    if (cached && (now - cached.timestamp) < GROUP_CACHE_TTL) {
        return cached.data;
    }
    try {
        const metadata = await zk.groupMetadata(groupId);
        groupMetadataCache[groupId] = { data: metadata, timestamp: now };
        return metadata;
    } catch (e) {
        return cached ? cached.data : null;
    }
}

const store = (0, baileys_1.makeInMemoryStore)({
    logger: pino().child({ level: "silent", stream: "store" }),
});

setTimeout(() => {
    async function main() {
        const { version, isLatest } = await (0, baileys_1.fetchLatestBaileysVersion)();
        const { state, saveCreds } = await (0, baileys_1.useMultiFileAuthState)(__dirname + "/auth");
        const sockOptions = {
            version,
            logger: pino({ level: "silent" }),
            browser: ['Bmw-Md', "safari", "1.0.0"],
            printQRInTerminal: true,
            fireInitQueries: false,
            shouldSyncHistoryMessage: false,
            downloadHistory: false,
            syncFullHistory: false,
            generateHighQualityLinkPreview: true,
            markOnlineOnConnect: false,
            keepAliveIntervalMs: 30_000,
            auth: {
                creds: state.creds,
                keys: (0, baileys_1.makeCacheableSignalKeyStore)(state.keys, logger),
            },
            getMessage: async (key) => {
                if (store) {
                    const msg = await store.loadMessage(key.remoteJid, key.id, undefined);
                    return msg.message || undefined;
                }
                return {
                    conversation: 'An Error Occurred, Repeat Command!'
                };
            }
        };

        const zk = (0, baileys_1.default)(sockOptions);
        store.bind(zk.ev);

        zk.ev.on("messages.upsert", async (m) => {
            const { messages } = m;
            const ms = messages[0];
            if (!ms.message) return;

            // Store messages for anti-delete
            try {
                const chatId = ms.key.remoteJid;
                if (!messageStore[chatId]) {
                    messageStore[chatId] = [];
                }
                messageStore[chatId].push({
                    key: ms.key,
                    message: ms.message,
                    messageTimestamp: ms.messageTimestamp || Date.now() / 1000,
                    pushName: ms.pushName
                });
                if (messageStore[chatId].length > 50) {
                    messageStore[chatId] = messageStore[chatId].slice(-50);
                }
            } catch (storeError) {
                console.log("Message store error:", storeError.message);
            }

            // Check for deleted messages
            if (conf.ANTIDELETE1 === "yes" || conf.ANTIDELETE2 === "yes" || conf.ADM === "yes") {
                if (ms.message?.protocolMessage && ms.message.protocolMessage.type === 0) {
                    console.log("🗑️ DELETED MESSAGE DETECTED!");
                    const deletedKey = ms.message.protocolMessage.key;
                    const chatId = deletedKey.remoteJid;
                    const messageId = deletedKey.id;
                    
                    let deletedMessage = null;
                    if (messageStore[chatId]) {
                        deletedMessage = messageStore[chatId].find(msg => msg.key.id === messageId);
                    }
                    
                    if (deletedMessage) {
                        console.log("✅ Deleted message found in store!");
                        try {
                            const participant = deletedMessage.key.participant || deletedMessage.key.remoteJid;
                            const senderNumber = participant.split('@')[0];
                            const ownerJid = conf.NUMERO_OWNER + "@s.whatsapp.net";
                            
                            let chatName = chatId;
                            if (chatId.endsWith('@g.us')) {
                                try {
                                    const groupMeta = await zk.groupMetadata(chatId);
                                    chatName = groupMeta.subject || chatId;
                                } catch (e) {}
                            }
                            
                            // Handle different message types
                            if (deletedMessage.message.conversation) {
                                await zk.sendMessage(ownerJid, {
                                    text: `╭━━━ *『 DELETED MESSAGE 』* ━━━╮\n┃\n┃ 👤 *Sender:* ${senderNumber}\n┃ 💬 *Chat:* ${chatName}\n┃ 📝 *Content:* \n┃ ${deletedMessage.message.conversation}\n┃\n╰━━━━━━━━━━━━━━━━━━━━━━━━━━╯`
                                });
                            } else if (deletedMessage.message.extendedTextMessage?.text) {
                                await zk.sendMessage(ownerJid, {
                                    text: `╭━━━ *『 DELETED MESSAGE 』* ━━━╮\n┃\n┃ 👤 *Sender:* ${senderNumber}\n┃ 💬 *Chat:* ${chatName}\n┃ 📝 *Content:* \n┃ ${deletedMessage.message.extendedTextMessage.text}\n┃\n╰━━━━━━━━━━━━━━━━━━━━━━━━━━╯`
                                });
                            } else if (deletedMessage.message.imageMessage) {
                                const caption = deletedMessage.message.imageMessage.caption || '';
                                const imagePath = await zk.downloadAndSaveMediaMessage(deletedMessage.message.imageMessage);
                                await zk.sendMessage(ownerJid, {
                                    image: { url: imagePath },
                                    caption: `╭━━━ *『 DELETED IMAGE 』* ━━━╮\n┃\n┃ 👤 *Sender:* ${senderNumber}\n┃ 💬 *Chat:* ${chatName}\n┃ 📝 *Caption:* ${caption}\n┃\n╰━━━━━━━━━━━━━━━━━━━━━━━━━━╯`
                                });
                            } else if (deletedMessage.message.videoMessage) {
                                const caption = deletedMessage.message.videoMessage.caption || '';
                                const videoPath = await zk.downloadAndSaveMediaMessage(deletedMessage.message.videoMessage);
                                await zk.sendMessage(ownerJid, {
                                    video: { url: videoPath },
                                    caption: `╭━━━ *『 DELETED VIDEO 』* ━━━╮\n┃\n┃ 👤 *Sender:* ${senderNumber}\n┃ 💬 *Chat:* ${chatName}\n┃ 📝 *Caption:* ${caption}\n┃\n╰━━━━━━━━━━━━━━━━━━━━━━━━━━╯`
                                });
                            }
                        } catch (sendError) {
                            console.error("Error sending deleted message:", sendError);
                        }
                    } else {
                        console.log("❌ Deleted message not found in store");
                    }
                }
            }

            // Auto status handling
            if (ms.key && ms.key.remoteJid === "status@broadcast") {
                console.log("Status detected from:", ms.key.participant?.split('@')[0] || 'unknown');
                
                if (conf.AUTO_READ_STATUS === "yes") {
                    try {
                        await zk.readMessages([ms.key]);
                        console.log("Status read");
                    } catch (readError) {
                        console.log("Auto-read failed:", readError.message);
                    }
                }
                
                if (conf.AUTO_REACT_STATUS === "yes") {
                    const now = Date.now();
                    if (now - (global.lastReactionTime || 0) < 5000) {
                        console.log("Throttling reaction to prevent overflow");
                    } else {
                        const botId = zk.user && zk.user.id ? 
                            zk.user.id.split(":")[0] + "@s.whatsapp.net" : 
                            null;
                            
                        if (botId) {
                            try {
                                await zk.sendMessage(ms.key.remoteJid, {
                                    react: {
                                        key: ms.key,
                                        text: "❤",
                                    }
                                }, {
                                    statusJidList: [ms.key.participant, botId],
                                });
                                global.lastReactionTime = Date.now();
                                console.log(`Reacted to status with ❤`);
                                await new Promise(resolve => setTimeout(resolve, 2000));
                            } catch (error) {
                                console.log("React error:", error.message);
                                setTimeout(async () => {
                                    try {
                                        await zk.sendMessage(ms.key.remoteJid, {
                                            react: {
                                                key: ms.key,
                                                text: "❤",
                                            }
                                        }, {
                                            statusJidList: [ms.key.participant, botId],
                                        });
                                        global.lastReactionTime = Date.now();
                                        console.log("React success on retry");
                                    } catch (e) {
                                        console.log("React retry failed:", e.message);
                                    }
                                }, 3000);
                            }
                        }
                    }
                }
                
                if (conf.AUTO_DOWNLOAD_STATUS === "yes") {
                    try {
                        const ownerNumber = conf.NUMERO_OWNER + "@s.whatsapp.net";
                        const statusSender = ms.key.participant || ms.participant;
                        
                        if (!statusSender || statusSender === ownerNumber) return;
                        
                        if (ms.message?.extendedTextMessage) {
                            var stTxt = ms.message.extendedTextMessage.text;
                            await zk.sendMessage(ownerNumber, { 
                                text: `📱 *STATUS UPDATE*\nFrom: @${statusSender.split('@')[0]}\n\n${stTxt}`,
                                mentions: [statusSender]
                            });
                        } else if (ms.message?.imageMessage) {
                            var stMsg = ms.message.imageMessage.caption || "";
                            var stImg = await zk.downloadAndSaveMediaMessage(ms.message.imageMessage, `status_${Date.now()}`);
                            await zk.sendMessage(ownerNumber, { 
                                image: { url: stImg }, 
                                caption: `📱 *STATUS UPDATE*\nFrom: @${statusSender.split('@')[0]}\n\n${stMsg}`,
                                mentions: [statusSender]
                            });
                        } else if (ms.message?.videoMessage) {
                            var stMsg = ms.message.videoMessage.caption || "";
                            var stVideo = await zk.downloadAndSaveMediaMessage(ms.message.videoMessage, `status_${Date.now()}`);
                            await zk.sendMessage(ownerNumber, {
                                video: { url: stVideo }, 
                                caption: `📱 *STATUS UPDATE*\nFrom: @${statusSender.split('@')[0]}\n\n${stMsg}`,
                                mentions: [statusSender]
                            });
                        }
                    } catch (downloadError) {
                        console.log("Auto-download failed:", downloadError.message);
                    }
                }
            }

            const decodeJid = (jid) => {
                if (!jid) return jid;
                if (/:\d+@/gi.test(jid)) {
                    let decode = (0, baileys_1.jidDecode)(jid) || {};
                    return decode.user && decode.server && decode.user + '@' + decode.server || jid;
                } else return jid;
            };

            var mtype = (0, baileys_1.getContentType)(ms.message);
            var texte = mtype == "conversation" ? ms.message.conversation : 
                       mtype == "imageMessage" ? ms.message.imageMessage?.caption : 
                       mtype == "videoMessage" ? ms.message.videoMessage?.caption : 
                       mtype == "extendedTextMessage" ? ms.message?.extendedTextMessage?.text : 
                       mtype == "buttonsResponseMessage" ? ms?.message?.buttonsResponseMessage?.selectedButtonId : 
                       mtype == "listResponseMessage" ? ms.message?.listResponseMessage?.singleSelectReply?.selectedRowId : 
                       mtype == "messageContextInfo" ? (ms?.message?.buttonsResponseMessage?.selectedButtonId || ms.message?.listResponseMessage?.singleSelectReply?.selectedRowId || ms.text) : "";
            
            var origineMessage = ms.key.remoteJid;
            var idBot = decodeJid(zk.user.id);
            var servBot = idBot.split('@')[0];
            const verifGroupe = origineMessage?.endsWith("@g.us");
            var infosGroupe = verifGroupe ? await getGroupMetadata(zk, origineMessage) : null;
            var nomGroupe = infosGroupe ? infosGroupe.subject : "";
            var msgRepondu = ms.message.extendedTextMessage?.contextInfo?.quotedMessage;
            var auteurMsgRepondu = decodeJid(ms.message?.extendedTextMessage?.contextInfo?.participant);
            var mr = ms.Message?.extendedTextMessage?.contextInfo?.mentionedJid;
            var utilisateur = mr ? mr : msgRepondu ? auteurMsgRepondu : "";
            var auteurMessage = verifGroupe ? (ms.key.participant ? ms.key.participant : ms.participant) : origineMessage;
            
            if (ms.key.fromMe) {
                auteurMessage = idBot;
            }
            
            var membreGroupe = verifGroupe ? ms.key.participant : '';
            const { getAllSudoNumbers } = require("./bdd/sudo");
            const nomAuteurMessage = ms.pushName;
            const dj = '255693629079';
            const dj2 = '255760164530';
            const dj3 = "255693629079";
            const luffy = '255760164530';
            const sudo = await getAllSudoNumbers();
            const superUserNumbers = [servBot, dj, dj2, dj3, luffy, conf.NUMERO_OWNER].map((s) => s.replace(/[^0-9]/g) + "@s.whatsapp.net");
            const allAllowedNumbers = superUserNumbers.concat(sudo);
            const superUser = allAllowedNumbers.includes(auteurMessage);
            
            var dev = [dj, dj2, dj3, luffy].map((t) => t.replace(/[^0-9]/g) + "@s.whatsapp.net").includes(auteurMessage);
            
            function repondre(mes) { 
                zk.sendMessage(origineMessage, { text: mes }, { quoted: ms }); 
            }

            function groupeAdmin(mbre) {
                let admin = [];
                for (let m of mbre) {
                    if (m.admin == null) continue;
                    admin.push(m.id);
                }
                return admin;
            }

            const mbre = verifGroupe && infosGroupe ? infosGroupe.participants : [];
            let admins = verifGroupe ? groupeAdmin(mbre) : [];
            const verifAdmin = verifGroupe ? admins.includes(auteurMessage) : false;
            var verifZokouAdmin = verifGroupe ? admins.includes(idBot) : false;

            const arg = texte ? texte.trim().split(/ +/).slice(1) : null;
            const verifCom = texte ? texte.startsWith(prefixe) : false;
            const com = verifCom ? texte.slice(1).trim().split(/ +/).shift().toLowerCase() : false;

            // Presence update
            if (verifCom) {
                var etat = conf.ETAT;
                try {
                    if (etat == 1) await zk.sendPresenceUpdate("available", origineMessage);
                    else if (etat == 2) await zk.sendPresenceUpdate("composing", origineMessage);
                    else if (etat == 3) await zk.sendPresenceUpdate("recording", origineMessage);
                } catch (e) {}
            }

            const lien = conf.URL.split(',');

            function mybotpic() {
                const indiceAleatoire = Math.floor(Math.random() * lien.length);
                const lienAleatoire = lien[indiceAleatoire];
                return lienAleatoire;
            }

            var commandeOptions = {
                superUser, dev,
                verifGroupe,
                mbre,
                membreGroupe,
                verifAdmin,
                infosGroupe,
                nomGroupe,
                auteurMessage,
                nomAuteurMessage,
                idBot,
                verifZokouAdmin,
                prefixe,
                arg,
                repondre,
                mtype,
                groupeAdmin,
                msgRepondu,
                auteurMsgRepondu,
                ms,
                mybotpic
            };

            // ============ ANTI-LINK - FULLY FIXED AND WORKING ============
            try {
                // Check if message contains a link (only in groups)
                if (texte && verifGroupe) {
                    // Comprehensive link detection patterns
                    const linkPatterns = [
                        /https?:\/\/[^\s]+/gi,
                        /www\.[^\s]+/gi,
                        /chat\.whatsapp\.com\/[^\s]+/gi,
                        /wa\.me\/[^\s]+/gi,
                        /t\.me\/[^\s]+/gi,
                        /telegram\.me\/[^\s]+/gi,
                        /youtube\.com\/[^\s]+/gi,
                        /youtu\.be\/[^\s]+/gi,
                        /instagram\.com\/[^\s]+/gi,
                        /facebook\.com\/[^\s]+/gi,
                        /fb\.com\/[^\s]+/gi,
                        /twitter\.com\/[^\s]+/gi,
                        /x\.com\/[^\s]+/gi,
                        /tiktok\.com\/[^\s]+/gi,
                        /pinimg\.com\/[^\s]+/gi,
                        /pinterest\.com\/[^\s]+/gi,
                        /snapchat\.com\/[^\s]+/gi,
                        /discord\.gg\/[^\s]+/gi,
                        /github\.com\/[^\s]+/gi,
                        /bit\.ly\/[^\s]+/gi,
                        /tinyurl\.com\/[^\s]+/gi,
                        /shorturl\.at\/[^\s]+/gi,
                        /rb\.gy\/[^\s]+/gi,
                        /cutt\.ly\/[^\s]+/gi,
                        /ow\.ly\/[^\s]+/gi,
                        /is\.gd\/[^\s]+/gi,
                        /buff\.ly\/[^\s]+/gi
                    ];
                    
                    let containsLink = false;
                    for (let pattern of linkPatterns) {
                        if (pattern.test(texte)) {
                            containsLink = true;
                            break;
                        }
                    }
                    
                    if (containsLink) {
                        console.log("🔗 LINK DETECTED IN GROUP:", origineMessage);
                        
                        // Check if antilink is enabled for this group
                        const antilinkEnabled = await verifierEtatJid(origineMessage);
                        
                        if (antilinkEnabled) {
                            console.log("🛡️ ANTI-LINK IS ENABLED FOR THIS GROUP");
                            
                            // Check if user is admin or superuser or bot
                            if (!verifAdmin && !superUser && auteurMessage !== idBot) {
                                console.log("⚠️ NON-ADMIN SENT LINK - TAKING ACTION");
                                
                                // Get action for this group (delete, remove, or warn)
                                const action = await recupererActionJid(origineMessage) || 'delete';
                                
                                // Delete the message first (always delete)
                                try {
                                    await zk.sendMessage(origineMessage, { 
                                        delete: {
                                            remoteJid: origineMessage,
                                            fromMe: false,
                                            id: ms.key.id,
                                            participant: auteurMessage
                                        }
                                    });
                                    console.log("✅ LINK MESSAGE DELETED");
                                } catch (deleteError) {
                                    console.log("Failed to delete message:", deleteError.message);
                                }
                                
                                // Take action based on settings
                                if (action === 'remove') {
                                    try {
                                        await zk.groupParticipantsUpdate(origineMessage, [auteurMessage], "remove");
                                        await zk.sendMessage(origineMessage, { 
                                            text: `🚫 *ANTI-LINK*\n\n@${auteurMessage.split("@")[0]} has been removed for sending a link.`,
                                            mentions: [auteurMessage]
                                        });
                                        console.log("✅ USER REMOVED FOR SENDING LINK");
                                    } catch (removeError) {
                                        console.log("Failed to remove user:", removeError.message);
                                        
                                        // If can't remove, at least warn
                                        await zk.sendMessage(origineMessage, { 
                                            text: `⚠️ *ANTI-LINK*\n\n@${auteurMessage.split("@")[0]} Links are not allowed in this group!`,
                                            mentions: [auteurMessage]
                                        });
                                    }
                                } else if (action === 'warn') {
                                    // Implement warning system
                                    try {
                                        const { getWarnCountByJID, ajouterUtilisateurAvecWarnCount } = require('./bdd/warn');
                                        let warn = await getWarnCountByJID(auteurMessage) || 0;
                                        let warnlimit = conf.WARN_COUNT || 3;
                                        
                                        await ajouterUtilisateurAvecWarnCount(auteurMessage);
                                        warn++;
                                        
                                        if (warn >= warnlimit) {
                                            try {
                                                await zk.groupParticipantsUpdate(origineMessage, [auteurMessage], "remove");
                                                await zk.sendMessage(origineMessage, { 
                                                    text: `🚫 *ANTI-LINK*\n\n@${auteurMessage.split("@")[0]} removed for reaching warn limit (${warnlimit}).`,
                                                    mentions: [auteurMessage]
                                                });
                                                console.log("✅ USER REMOVED AFTER WARN LIMIT");
                                            } catch (e) {
                                                console.log("Failed to remove after warn limit:", e.message);
                                            }
                                        } else {
                                            const remaining = warnlimit - warn;
                                            await zk.sendMessage(origineMessage, { 
                                                text: `⚠️ *ANTI-LINK*\n\n@${auteurMessage.split("@")[0]} Links are not allowed!\nWarning: ${warn}/${warnlimit}\nRemaining: ${remaining}`,
                                                mentions: [auteurMessage]
                                            });
                                            console.log(`⚠️ USER WARNED: ${warn}/${warnlimit}`);
                                        }
                                    } catch (warnError) {
                                        console.log("Warning system error:", warnError.message);
                                        // Fallback to simple warning
                                        await zk.sendMessage(origineMessage, { 
                                            text: `⚠️ *ANTI-LINK*\n\n@${auteurMessage.split("@")[0]} Links are not allowed in this group!`,
                                            mentions: [auteurMessage]
                                        });
                                    }
                                } else {
                                    // Default: just delete and warn
                                    await zk.sendMessage(origineMessage, { 
                                        text: `⚠️ *ANTI-LINK*\n\n@${auteurMessage.split("@")[0]} Links are not allowed in this group!`,
                                        mentions: [auteurMessage]
                                    });
                                    console.log("⚠️ USER WARNED FOR LINK");
                                }
                            } else {
                                console.log("✅ Admin/SuperUser/Bot sent link - ignoring");
                            }
                        } else {
                            console.log("📝 Anti-link is disabled for this group");
                        }
                    }
                }
            } catch (antilinkError) {
                console.log("⚠️ ANTI-LINK ERROR:", antilinkError.message);
                console.log("Stack trace:", antilinkError.stack);
            }

            // ============ ANTI-BOT ============
            try {
                const botMsg = ms.key?.id?.startsWith('BAES') && ms.key?.id?.length === 16;
                const baileysMsg = ms.key?.id?.startsWith('BAE5') && ms.key?.id?.length === 16;
                
                if ((botMsg || baileysMsg) && verifGroupe) {
                    if (mtype === 'reactionMessage') { 
                        console.log('Ignoring reaction message'); 
                        return;
                    }
                    
                    const antibotactiver = await atbverifierEtatJid(origineMessage);
                    if (!antibotactiver) return;
                    
                    if (verifAdmin || auteurMessage === idBot) { 
                        console.log('Admin or bot message - ignoring');
                        return;
                    }
                    
                    const key = {
                        remoteJid: origineMessage,
                        fromMe: false,
                        id: ms.key.id,
                        participant: auteurMessage
                    };
                    
                    const action = await atbrecupererActionJid(origineMessage);
                    
                    if (action === 'remove') {
                        try {
                            await zk.groupParticipantsUpdate(origineMessage, [auteurMessage], "remove");
                            await zk.sendMessage(origineMessage, { 
                                text: `🤖 *ANTI-BOT*\n\nBot detected and removed: @${auteurMessage.split("@")[0]}`,
                                mentions: [auteurMessage]
                            });
                            await zk.sendMessage(origineMessage, { delete: key });
                        } catch (e) {
                            console.log("Anti-bot remove error:", e);
                        }
                    } else if (action === 'delete') {
                        await zk.sendMessage(origineMessage, { 
                            text: `🤖 *ANTI-BOT*\n\nBot message deleted: @${auteurMessage.split("@")[0]}`,
                            mentions: [auteurMessage]
                        });
                        await zk.sendMessage(origineMessage, { delete: key });
                    } else if (action === 'warn') {
                        const { getWarnCountByJID, ajouterUtilisateurAvecWarnCount } = require('./bdd/warn');
                        let warn = await getWarnCountByJID(auteurMessage);
                        let warnlimit = conf.WARN_COUNT || 3;
                        
                        if (warn >= warnlimit) {
                            try {
                                await zk.groupParticipantsUpdate(origineMessage, [auteurMessage], "remove");
                                await zk.sendMessage(origineMessage, { 
                                    text: `🤖 *ANTI-BOT*\n\nBot removed for reaching warn limit: @${auteurMessage.split("@")[0]}`,
                                    mentions: [auteurMessage]
                                });
                                await zk.sendMessage(origineMessage, { delete: key });
                            } catch (e) {
                                console.log("Anti-bot remove after warn error:", e);
                            }
                        } else {
                            await ajouterUtilisateurAvecWarnCount(auteurMessage);
                            const remaining = warnlimit - (warn + 1);
                            await zk.sendMessage(origineMessage, { 
                                text: `🤖 *ANTI-BOT*\n\n⚠️ Warning ${warn + 1}/${warnlimit}\nRemaining: ${remaining}\n@${auteurMessage.split("@")[0]}`,
                                mentions: [auteurMessage]
                            });
                            await zk.sendMessage(origineMessage, { delete: key });
                        }
                    }
                }
            } catch (er) {
                console.log('Anti-bot error:', er.message);
            }

            // Level system
            if (texte && auteurMessage.endsWith("s.whatsapp.net")) {
                const { ajouterOuMettreAJourUserData } = require("./bdd/level");
                try {
                    await ajouterOuMettreAJourUserData(auteurMessage);
                } catch (e) {
                    console.error(e);
                }
            }

            // Mention response
            try {
                if (ms.message[mtype]?.contextInfo?.mentionedJid && 
                    (ms.message[mtype].contextInfo.mentionedJid.includes(idBot) || 
                     ms.message[mtype].contextInfo.mentionedJid.includes(conf.NUMERO_OWNER + '@s.whatsapp.net'))) {
                    
                    if (superUser) return;
                    
                    let mbd = require('./bdd/mention');
                    let alldata = await mbd.recupererToutesLesValeurs();
                    let data = alldata[0];
                    
                    if (data.status === 'non') return;
                    
                    let msg;
                    if (data.type.toLowerCase() === 'image') {
                        msg = { image: { url: data.url }, caption: data.message };
                    } else if (data.type.toLowerCase() === 'video') {
                        msg = { video: { url: data.url }, caption: data.message };
                    } else if (data.type.toLowerCase() === 'sticker') {
                        let stickerMess = new Sticker(data.url, {
                            pack: conf.NOM_OWNER,
                            type: StickerTypes.FULL,
                            categories: ["🤩", "🎉"],
                            id: "12345",
                            quality: 70,
                            background: "transparent",
                        });
                        const stickerBuffer2 = await stickerMess.toBuffer();
                        msg = { sticker: stickerBuffer2 };
                    } else if (data.type.toLowerCase() === 'audio') {
                        msg = { audio: { url: data.url }, mimetype: 'audio/mp4' };
                    }
                    
                    zk.sendMessage(origineMessage, msg, { quoted: ms });
                }
            } catch (error) {}

            // Execute commands
            if (verifCom) {
                const cd = evt.cm.find((zokou) => zokou.nomCom === com);
                if (cd) {
                    try {
                        if ((conf.MODE).toLowerCase() != 'yes' && !superUser) {
                            return;
                        }

                        // PM Permit
                        if (!superUser && origineMessage === auteurMessage && conf.PM_PERMIT === "yes") {
                            repondre("You don't have access to commands here");
                            return;
                        }

                        // Ban Group
                        if (!superUser && verifGroupe) {
                            let req = await isGroupBanned(origineMessage);
                            if (req) return;
                        }

                        // Only Admin
                        if (!verifAdmin && verifGroupe) {
                            let req = await isGroupOnlyAdmin(origineMessage);
                            if (req) return;
                        }

                        // Ban User
                        if (!superUser) {
                            let req = await isUserBanned(auteurMessage);
                            if (req) {
                                repondre("You are banned from bot commands");
                                return;
                            }
                        }

                        reagir(origineMessage, zk, ms, cd.reaction);
                        cd.fonction(origineMessage, zk, commandeOptions);
                    } catch (e) {
                        console.log("Command error:", e);
                        zk.sendMessage(origineMessage, { text: "Error: " + e.message }, { quoted: ms });
                    }
                }
            }
        });

        // Group participants update events
        const { recupevents } = require('./bdd/welcome');

        zk.ev.on('group-participants.update', async (group) => {
            if (groupMetadataCache[group.id]) delete groupMetadataCache[group.id];

            let ppgroup;
            try {
                ppgroup = await zk.profilePictureUrl(group.id, 'image');
            } catch {
                ppgroup = '';
            }

            try {
                const metadata = await zk.groupMetadata(group.id);

                if (group.action == 'add' && (await recupevents(group.id, "welcome") == 'on')) {
                    let msg = `*SEBASTIAN MD WELCOME MESSAGE*`;
                    let membres = group.participants;
                    for (let membre of membres) {
                        msg += ` \n❒ *Hey* 🖐️ @${membre.split("@")[0]} WELCOME TO OUR GROUP. \n\n`;
                    }
                    msg += `❒ *READ THE GROUP DESCRIPTION TO AVOID GETTING REMOVED* `;
                    zk.sendMessage(group.id, { image: { url: ppgroup }, caption: msg, mentions: membres });
                } else if (group.action == 'remove' && (await recupevents(group.id, "goodbye") == 'on')) {
                    let msg = `one or somes member(s) left group;\n`;
                    let membres = group.participants;
                    for (let membre of membres) {
                        msg += `@${membre.split("@")[0]}\n`;
                    }
                    zk.sendMessage(group.id, { text: msg, mentions: membres });
                } else if (group.action == 'promote' && (await recupevents(group.id, "antipromote") == 'on')) {
                    if (group.author == metadata.owner || group.author == conf.NUMERO_OWNER + '@s.whatsapp.net' || group.author == decodeJid(zk.user.id) || group.author == group.participants[0]) {
                        return;
                    }
                    await zk.groupParticipantsUpdate(group.id, [group.author, group.participants[0]], "demote");
                    zk.sendMessage(group.id, {
                        text: `@${(group.author).split("@")[0]} has violated the anti-promotion rule, therefore both ${group.author.split("@")[0]} and @${(group.participants[0]).split("@")[0]} have been removed from administrative rights.`,
                        mentions: [group.author, group.participants[0]]
                    });
                } else if (group.action == 'demote' && (await recupevents(group.id, "antidemote") == 'on')) {
                    if (group.author == metadata.owner || group.author == conf.NUMERO_OWNER + '@s.whatsapp.net' || group.author == decodeJid(zk.user.id) || group.author == group.participants[0]) {
                        return;
                    }
                    await zk.groupParticipantsUpdate(group.id, [group.author], "demote");
                    await zk.groupParticipantsUpdate(group.id, [group.participants[0]], "promote");
                    zk.sendMessage(group.id, {
                        text: `@${(group.author).split("@")[0]} has violated the anti-demotion rule by removing @${(group.participants[0]).split("@")[0]}. Consequently, he has been stripped of administrative rights.`,
                        mentions: [group.author, group.participants[0]]
                    });
                }
            } catch (e) {
                console.error(e);
            }
        });

        // Cron setup
        async function activateCrons() {
            const cron = require('node-cron');
            const { getCron } = require('./bdd/cron');

            let crons = await getCron();
            console.log(crons);
            if (crons.length > 0) {
                for (let i = 0; i < crons.length; i++) {
                    if (crons[i].mute_at != null) {
                        let set = crons[i].mute_at.split(':');
                        console.log(`Setting automute for ${crons[i].group_id} at ${set[0]}:${set[1]}`);
                        cron.schedule(`${set[1]} ${set[0]} * * *`, async () => {
                            await zk.groupSettingUpdate(crons[i].group_id, 'announcement');
                            zk.sendMessage(crons[i].group_id, { 
                                image: { url: './media/chrono.webp' }, 
                                caption: "Hello, it's time to close the group; sayonara." 
                            });
                        }, { timezone: "Africa/Tanzania" });
                    }

                    if (crons[i].unmute_at != null) {
                        let set = crons[i].unmute_at.split(':');
                        console.log(`Setting autounmute for ${set[0]}:${set[1]}`);
                        cron.schedule(`${set[1]} ${set[0]} * * *`, async () => {
                            await zk.groupSettingUpdate(crons[i].group_id, 'not_announcement');
                            zk.sendMessage(crons[i].group_id, { 
                                image: { url: './media/chrono.webp' }, 
                                caption: "Good morning; It's time to open the group." 
                            });
                        }, { timezone: "Africa/Tanzania" });
                    }
                }
            } else {
                console.log('Crons not activated');
            }
            return;
        }

        // Contacts update
        zk.ev.on("contacts.upsert", async (contacts) => {
            const insertContact = (newContact) => {
                for (const contact of newContact) {
                    if (store.contacts[contact.id]) {
                        Object.assign(store.contacts[contact.id], contact);
                    } else {
                        store.contacts[contact.id] = contact;
                    }
                }
                return;
            };
            insertContact(contacts);
        });

        // Connection update
        zk.ev.on("connection.update", async (con) => {
            const { lastDisconnect, connection } = con;
            if (connection === "connecting") {
                console.log("ℹ️ Sebastian md is connecting...");
            } else if (connection === 'open') {
                console.log("✅ Sebastian md Connected to WhatsApp! ☺️");
                console.log("--");
                await (0, baileys_1.delay)(200);
                console.log("------");
                await (0, baileys_1.delay)(300);
                console.log("------------------/-----");
                console.log("Sebastian md is Online 🕸\n\n");
                console.log("Loading Sebastian Commands ...\n");
                
                fs.readdirSync(__dirname + "/commandes").forEach((fichier) => {
                    if (path.extname(fichier).toLowerCase() == ".js") {
                        try {
                            require(__dirname + "/commandes/" + fichier);
                            console.log(fichier + " Installed Successfully✔️");
                        } catch (e) {
                            console.log(`${fichier} could not be installed due to: ${e}`);
                        }
                        (0, baileys_1.delay)(300);
                    }
                });
                
                (0, baileys_1.delay)(700);
                var md;
                if ((conf.MODE).toLowerCase() === "yes") {
                    md = "public";
                } else if ((conf.MODE).toLowerCase() === "no") {
                    md = "private";
                } else {
                    md = "undefined";
                }
                console.log("Commands Installation Completed ✅");

                await activateCrons();

                if ((conf.DP).toLowerCase() === 'yes') {
                    let cmsg = `      ❒─❒⁠⁠⁠⁠ *BOT-IS-RUNNING* ❒⁠⁠⁠⁠─⁠⁠⁠⁠❒⁠⁠⁠⁠
╭❒⁠⁠⁠⁠─❒⁠⁠⁠⁠─❒⁠⁠⁠⁠─❒⁠⁠⁠⁠─❒⁠⁠⁠⁠              
❒⁠⁠⁠⁠ 𝑫𝑬𝑽   : *Sebastian*   
❒⁠⁠⁠⁠ 𝑩𝑶𝑻   : *SEBASTIAN MD*
❒.  𝑾𝑪𝑯𝑨𝑵𝑵𝑳 :https://whatsapp.com/channel/0029Vb7LxhRGE56l9woRjd2g
╰❒⁠⁠⁠⁠─❒⁠⁠⁠⁠─❒⁠⁠⁠⁠─❒⁠⁠⁠⁠─❒⁠⁠⁠⁠`;
                    await zk.sendMessage(zk.user.id, { text: cmsg });
                }
            } else if (connection == "close") {
                let raisonDeconnexion = new boom_1.Boom(lastDisconnect?.error)?.output.statusCode;
                if (raisonDeconnexion === baileys_1.DisconnectReason.badSession) {
                    console.log('Session id error, rescan again...');
                } else if (raisonDeconnexion === baileys_1.DisconnectReason.connectionClosed) {
                    console.log('Connection closed, reconnecting...');
                    setTimeout(main, 5000);
                } else if (raisonDeconnexion === baileys_1.DisconnectReason.connectionLost) {
                    console.log('Connection lost, reconnecting...');
                    setTimeout(main, 5000);
                } else if (raisonDeconnexion === baileys_1.DisconnectReason?.connectionReplaced) {
                    console.log('connexion réplacée ,,, une sesssion est déjà ouverte veuillez la fermer svp !!!');
                } else if (raisonDeconnexion === baileys_1.DisconnectReason.loggedOut) {
                    console.log('vous êtes déconnecté,,, veuillez rescanner le code qr svp');
                } else if (raisonDeconnexion === baileys_1.DisconnectReason.restartRequired) {
                    console.log('Restart required...');
                    setTimeout(main, 5000);
                } else {
                    console.log('redemarrage sur le coup de l\'erreur ', raisonDeconnexion);
                    setTimeout(main, 5000);
                    return;
                }
            }
        });

        // Creds update
        zk.ev.on("creds.update", saveCreds);

        // Utility functions
        zk.downloadAndSaveMediaMessage = async (message, filename = '', attachExtension = true) => {
            let quoted = message.msg ? message.msg : message;
            let mime = (message.msg || message).mimetype || '';
            let messageType = message.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0];
            const stream = await (0, baileys_1.downloadContentFromMessage)(quoted, messageType);
            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }
            let type = await FileType.fromBuffer(buffer);
            let trueFileName = './' + filename + '.' + type.ext;
            await fs.writeFile(trueFileName, buffer);
            return trueFileName;
        };

        zk.awaitForMessage = async (options = {}) => {
            return new Promise((resolve, reject) => {
                if (typeof options !== 'object') reject(new Error('Options must be an object'));
                if (typeof options.sender !== 'string') reject(new Error('Sender must be a string'));
                if (typeof options.chatJid !== 'string') reject(new Error('ChatJid must be a string'));
                if (options.timeout && typeof options.timeout !== 'number') reject(new Error('Timeout must be a number'));
                if (options.filter && typeof options.filter !== 'function') reject(new Error('Filter must be a function'));

                const timeout = options?.timeout || undefined;
                const filter = options?.filter || (() => true);
                let interval = undefined;

                let listener = (data) => {
                    let { type, messages } = data;
                    if (type == "notify") {
                        for (let message of messages) {
                            const fromMe = message.key.fromMe;
                            const chatId = message.key.remoteJid;
                            const isGroup = chatId.endsWith('@g.us');
                            const isStatus = chatId == 'status@broadcast';

                            const sender = fromMe ? zk.user.id.replace(/:.*@/g, '@') : (isGroup || isStatus) ? message.key.participant.replace(/:.*@/g, '@') : chatId;
                            if (sender == options.sender && chatId == options.chatJid && filter(message)) {
                                zk.ev.off('messages.upsert', listener);
                                clearTimeout(interval);
                                resolve(message);
                            }
                        }
                    }
                };
                
                zk.ev.on('messages.upsert', listener);
                if (timeout) {
                    interval = setTimeout(() => {
                        zk.ev.off('messages.upsert', listener);
                        reject(new Error('Timeout'));
                    }, timeout);
                }
            });
        };

        return zk;
    }

    let fichier = require.resolve(__filename);
    fs.watchFile(fichier, () => {
        fs.unwatchFile(fichier);
        console.log(`mise à jour ${__filename}`);
        delete require.cache[fichier];
        require(fichier);
    });
    
    main();
}, 5000);
