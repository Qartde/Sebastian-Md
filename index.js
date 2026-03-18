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
const { verifierEtatJid , recupererActionJid } = require("./bdd/antilien");
const { atbverifierEtatJid , atbrecupererActionJid } = require("./bdd/antibot");
let evt = require(__dirname + "/framework/zokou");
const {isUserBanned , addUserToBanList , removeUserFromBanList} = require("./bdd/banUser");
const  {addGroupToBanList,isGroupBanned,removeGroupFromBanList} = require("./bdd/banGroup");
const {isGroupOnlyAdmin,addGroupToOnlyAdminList,removeGroupFromOnlyAdminList} = require("./bdd/onlyAdmin");
let { reagir } = require(__dirname + "/framework/app");
var session = conf.session.replace(/Zokou-MD-WHATSAPP-BOT;;;=>/g,"");
const prefixe = conf.PREFIXE;
const more = String.fromCharCode(8206)
const readmore = more.repeat(4001)

// Global variables
global.lastReactionTime = 0;
global.deletedMessages = []; // Store deleted messages
global.antitag = global.antitag || {}; // Anti-tag settings

async function authentification() {
    try {
        if (!fs.existsSync(__dirname + "/auth/creds.json")) {
            console.log("connexion en cour ...");
            await fs.writeFileSync(__dirname + "/auth/creds.json", atob(session), "utf8");
        }
        else if (fs.existsSync(__dirname + "/auth/creds.json") && session != "zokk") {
            await fs.writeFileSync(__dirname + "/auth/creds.json", atob(session), "utf8");
        }
    }
    catch (e) {
        console.log("Session Invalid " + e);
        return;
    }
}
authentification();

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
            browser: ['Sebastian xmd', "safari", "1.0.0"],
            printQRInTerminal: true,
            fireInitQueries: false,
            shouldSyncHistoryMessage: true,
            downloadHistory: true,
            syncFullHistory: true,
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
            
            const decodeJid = (jid) => {
                if (!jid) return jid;
                if (/:\d+@/gi.test(jid)) {
                    let decode = (0, baileys_1.jidDecode)(jid) || {};
                    return decode.user && decode.server && decode.user + '@' + decode.server || jid;
                }
                else return jid;
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
            var infosGroupe = verifGroupe ? await zk.groupMetadata(origineMessage) : "";
            var nomGroupe = verifGroupe ? infosGroupe.subject : "";
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
            const dj = '255622286792';
            const dj2 = '255622286792';
            const dj3 = "255622286792";
            const luffy = '255622286792';
            const sudo = await getAllSudoNumbers();
            const superUserNumbers = [servBot, dj, dj2, dj3, luffy, conf.NUMERO_OWNER].map((s) => s.replace(/[^0-9]/g) + "@s.whatsapp.net");
            const allAllowedNumbers = superUserNumbers.concat(sudo);
            const superUser = allAllowedNumbers.includes(auteurMessage);
            
            var dev = [dj, dj2,dj3,luffy].map((t) => t.replace(/[^0-9]/g) + "@s.whatsapp.net").includes(auteurMessage);
            
            function repondre(mes) { zk.sendMessage(origineMessage, { text: mes }, { quoted: ms }); }
            
            console.log("\ SEBASTIAN MD is ONLINE");
            console.log("=========== written message===========");
            if (verifGroupe) {
                console.log("message provenant du groupe : " + nomGroupe);
            }
            console.log("message envoyé par : " + "[" + nomAuteurMessage + " : " + auteurMessage.split("@s.whatsapp.net")[0] + " ]");
            console.log("type de message : " + mtype);
            console.log("------ contenu du message ------");
            console.log(texte);
            
            function groupeAdmin(membreGroupe) {
                let admin = [];
                for (let m of membreGroupe) {
                    if (m.admin == null) continue;
                    admin.push(m.id);
                }
                return admin;
            }

            var etat = conf.ETAT;
            if(etat==1) { await zk.sendPresenceUpdate("available",origineMessage); }
            else if(etat==2) { await zk.sendPresenceUpdate("composing",origineMessage); }
            else if(etat==3) { await zk.sendPresenceUpdate("recording",origineMessage); }
            else { await zk.sendPresenceUpdate("unavailable",origineMessage); }

            const mbre = verifGroupe ? infosGroupe.participants : '';
            let admins = verifGroupe ? groupeAdmin(mbre) : [];
            const verifAdmin = verifGroupe ? admins.includes(auteurMessage) : false;
            var verifZokouAdmin = verifGroupe ? admins.includes(idBot) : false;
            
            const arg = texte ? texte.trim().split(/ +/).slice(1) : null;
            const verifCom = texte ? texte.startsWith(prefixe) : false;
            const com = verifCom ? texte.slice(1).trim().split(/ +/).shift().toLowerCase() : false;
           
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

            // ============ STORE MESSAGES FOR ANTI-DELETE ============
            try {
                const chatId = ms.key.remoteJid;
                if (!global.deletedMessages[chatId]) {
                    global.deletedMessages[chatId] = [];
                }
                
                // Store message with important data
                global.deletedMessages[chatId].push({
                    key: ms.key,
                    message: ms.message,
                    messageTimestamp: ms.messageTimestamp || Date.now() / 1000,
                    pushName: ms.pushName
                });
                
                // Keep only last 30 messages per chat
                if (global.deletedMessages[chatId].length > 30) {
                    global.deletedMessages[chatId] = global.deletedMessages[chatId].slice(-30);
                }
            } catch (storeError) {
                console.log("Message store error:", storeError.message);
            }

            // ============ ANTI-TAG SECTION (Imerekebishwa - Admin Hatafutwa) ============
            if (verifGroupe && global.antitag[origineMessage] && global.antitag[origineMessage].enabled === true) {
                try {
                    // Don't delete bot's own messages
                    if (!ms.key.fromMe) {
                        const sender = auteurMessage;
                        
                        // DEBUG: Angalia sender na admins
                        console.log("🔍 Anti-tag check - Sender:", sender);
                        console.log("🔍 Anti-tag check - Admins:", admins);
                        
                        // Check if sender is admin
                        const isSenderAdmin = admins.includes(sender);
                        console.log("🔍 Is sender admin?", isSenderAdmin);
                        
                        // Only delete non-admin messages
                        if (!isSenderAdmin) {
                            // Check if message contains any tag/mention
                            let hasTag = false;
                            
                            // Check for mentions
                            if (ms.message?.extendedTextMessage?.contextInfo?.mentionedJid) {
                                const mentioned = ms.message.extendedTextMessage.contextInfo.mentionedJid;
                                if (mentioned && mentioned.length > 0) {
                                    hasTag = true;
                                    console.log("📌 Mention detected:", mentioned);
                                }
                            }
                            
                            // Check for quoted message
                            if (ms.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
                                hasTag = true;
                                console.log("📌 Quote detected");
                            }
                            
                            // Check for @ symbol in text
                            if (texte && texte.includes('@')) {
                                hasTag = true;
                                console.log("📌 @ symbol detected");
                            }
                            
                            // If message contains a tag, delete it
                            if (hasTag) {
                                console.log(`🚫 DELETING message from ${sender} (non-admin)`);
                                
                                // Delete the message
                                await zk.sendMessage(origineMessage, {
                                    delete: {
                                        remoteJid: origineMessage,
                                        fromMe: false,
                                        id: ms.key.id,
                                        participant: sender
                                    }
                                });
                                
                                // Send warning
                                await zk.sendMessage(origineMessage, {
                                    text: `@${sender.split('@')[0]} 🚫 *Don't tag members!*`,
                                    mentions: [sender]
                                });
                            }
                        } else {
                            console.log(`✅ Admin tagged - NOT deleting: ${sender}`);
                        }
                    }
                } catch (antitagError) {
                    console.error("Anti-tag error:", antitagError);
                }
            }

            // ============ ENHANCED ANTI-DELETE MESSAGE ============
            if (ms.message?.protocolMessage && ms.message.protocolMessage.type === 0) {
                
                // Check if anti-delete is enabled from config
                if (conf.ANTI_DELETE_MESSAGE !== "yes" && conf.ADM !== "yes") {
                    console.log("Anti-delete is disabled");
                    return;
                }

                if (ms.key.fromMe || ms.message.protocolMessage.key.fromMe) {
                    console.log('Message deleted by me - ignoring');
                    return;
                }
                
                console.log(`🗑️ DELETED MESSAGE DETECTED!`);
                const deletedKey = ms.message.protocolMessage.key;
                const chatId = deletedKey.remoteJid;
                const messageId = deletedKey.id;
                
                console.log(`🔍 Looking for message ID: ${messageId} in ${chatId}`);
                
                // Find the deleted message in our store
                let deletedMessage = null;
                if (global.deletedMessages[chatId]) {
                    deletedMessage = global.deletedMessages[chatId].find(msg => msg.key.id === messageId);
                }
                
                if (deletedMessage) {
                    console.log("✅ Deleted message found in store!");
                    
                    try {
                        const participant = deletedMessage.key.participant || deletedMessage.key.remoteJid;
                        const senderNumber = participant.split('@')[0];
                        const ownerJid = conf.NUMERO_OWNER + "@s.whatsapp.net";
                        
                        // Get chat name if group
                        let chatName = chatId;
                        if (chatId.endsWith('@g.us')) {
                            try {
                                const groupMeta = await zk.groupMetadata(chatId);
                                chatName = groupMeta.subject || chatId;
                            } catch (e) {}
                        }
                        
                        // Get message type
                        const msgType = Object.keys(deletedMessage.message)[0] || 'unknown';
                        
                        // Send notification to owner
                        await zk.sendMessage(ownerJid, {
                            image: { url: './media/deleted-message.jpg' },
                            caption: `╭━━━ *『 ANTI-DELETE 』* ━━━╮
┃
┃ 👤 *Sender:* @${senderNumber}
┃ 💬 *Chat:* ${chatName}
┃ 📝 *Type:* ${msgType.replace('Message', '')}
┃
╰━━━━━━━━━━━━━━━━━━━━━━━━━━╯`,
                            mentions: [participant]
                        });
                        
                        // Handle different message types
                        if (deletedMessage.message.conversation) {
                            // Text message
                            await zk.sendMessage(ownerJid, {
                                text: `📝 *Deleted Text:*\n\n${deletedMessage.message.conversation}`
                            });
                        }
                        else if (deletedMessage.message.extendedTextMessage?.text) {
                            await zk.sendMessage(ownerJid, {
                                text: `📝 *Deleted Text:*\n\n${deletedMessage.message.extendedTextMessage.text}`
                            });
                        }
                        else if (deletedMessage.message.imageMessage) {
                            const caption = deletedMessage.message.imageMessage.caption || '';
                            const imagePath = await zk.downloadAndSaveMediaMessage(deletedMessage.message.imageMessage);
                            await zk.sendMessage(ownerJid, {
                                image: { url: imagePath },
                                caption: `🖼️ *Deleted Image*\n\n📝 Caption: ${caption}`
                            });
                        }
                        else if (deletedMessage.message.videoMessage) {
                            const caption = deletedMessage.message.videoMessage.caption || '';
                            const videoPath = await zk.downloadAndSaveMediaMessage(deletedMessage.message.videoMessage);
                            await zk.sendMessage(ownerJid, {
                                video: { url: videoPath },
                                caption: `🎥 *Deleted Video*\n\n📝 Caption: ${caption}`
                            });
                        }
                        else if (deletedMessage.message.audioMessage) {
                            const audioPath = await zk.downloadAndSaveMediaMessage(deletedMessage.message.audioMessage);
                            await zk.sendMessage(ownerJid, {
                                audio: { url: audioPath },
                                mimetype: 'audio/mp4'
                            });
                            await zk.sendMessage(ownerJid, {
                                text: `🎵 *Deleted Audio*`
                            });
                        }
                        else if (deletedMessage.message.stickerMessage) {
                            const stickerPath = await zk.downloadAndSaveMediaMessage(deletedMessage.message.stickerMessage);
                            await zk.sendMessage(ownerJid, {
                                sticker: { url: stickerPath }
                            });
                        }
                        
                        console.log('✅ Deleted message sent to owner successfully!');
                        
                    } catch (sendError) {
                        console.error("Error sending deleted message:", sendError);
                    }
                } else {
                    console.log("❌ Deleted message not found in store");
                }
            }

            // ============ AUTO STATUS HANDLING ============
            if (ms.key && ms.key.remoteJid === "status@broadcast") {
                
                // 1. AUTO READ STATUS
                if (conf.AUTO_READ_STATUS === "yes") {
                    try {
                        await zk.readMessages([ms.key]);
                        console.log("Status read");
                    } catch (readError) {
                        console.log("Auto-read failed:", readError.message);
                    }
                }
                
                // 2. AUTO REACT STATUS
                if (conf.AUTO_REACT_STATUS === "yes") {
                    const now = Date.now();
                    if (now - (global.lastReactionTime || 0) < 5000) {
                        console.log("Throttling reaction to prevent overflow");
                    } else {
                        const botId = zk.user && zk.user.id ? 
                            zk.user.id.split(":")[0] + "@s.whatsapp.net" : null;
                            
                        if (!botId) {
                            console.log("Bot ID not available. Skipping reaction.");
                        } else {
                            try {
                                await zk.sendMessage(ms.key.remoteJid, {
                                    react: {
                                        key: ms.key,
                                        text: "💙",
                                    }
                                }, {
                                    statusJidList: [ms.key.participant, botId],
                                });
                                
                                global.lastReactionTime = Date.now();
                                console.log(`Reacted to status with 💙`);
                                
                                await new Promise(resolve => setTimeout(resolve, 2000));
                                
                            } catch (error) {
                                console.log("React error:", error.message);
                                setTimeout(async () => {
                                    try {
                                        await zk.sendMessage(ms.key.remoteJid, {
                                            react: {
                                                key: ms.key,
                                                text: "💙",
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
                
                // 3. AUTO DOWNLOAD STATUS
                if (conf.AUTO_DOWNLOAD_STATUS === "yes") {
                    if (ms.message.extendedTextMessage) {
                        var stTxt = ms.message.extendedTextMessage.text;
                        await zk.sendMessage(idBot, { text: stTxt }, { quoted: ms });
                    }
                    else if (ms.message.imageMessage) {
                        var stMsg = ms.message.imageMessage.caption;
                        var stImg = await zk.downloadAndSaveMediaMessage(ms.message.imageMessage);
                        await zk.sendMessage(idBot, { image: { url: stImg }, caption: stMsg }, { quoted: ms });
                    }
                    else if (ms.message.videoMessage) {
                        var stMsg = ms.message.videoMessage.caption;
                        var stVideo = await zk.downloadAndSaveMediaMessage(ms.message.videoMessage);
                        await zk.sendMessage(idBot, {
                            video: { url: stVideo }, caption: stMsg
                        }, { quoted: ms });
                    }
                }
            }
            
            if (!dev && origineMessage == "120363158701337904@g.us") {
                return;
            }
            
            // Rang count
            if (texte && auteurMessage.endsWith("s.whatsapp.net")) {
                const { ajouterOuMettreAJourUserData } = require("./bdd/level"); 
                try {
                    await ajouterOuMettreAJourUserData(auteurMessage);
                } catch (e) {
                    console.error(e);
                }
            }
            
            // Mentions handling
            try {
                if (ms.message[mtype].contextInfo.mentionedJid && 
                    (ms.message[mtype].contextInfo.mentionedJid.includes(idBot) || 
                     ms.message[mtype].contextInfo.mentionedJid.includes(conf.NUMERO_OWNER + '@s.whatsapp.net'))) {
            
                    if (origineMessage == "120363158701337904@g.us") return;
                    if(superUser) return; 
                    
                    let mbd = require('./bdd/mention') ;
                    let alldata = await mbd.recupererToutesLesValeurs() ;
                    let data = alldata[0] ;
                    
                    if (data.status === 'non') return;
                    
                    let msg;
                    
                    if (data.type.toLocaleLowerCase() === 'image') {
                        msg = { image: { url: data.url }, caption: data.message };
                    } else if (data.type.toLocaleLowerCase() === 'video' ) {
                        msg = { video: { url: data.url }, caption: data.message };
                    } else if (data.type.toLocaleLowerCase() === 'sticker') {
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
                    } else if (data.type.toLocaleLowerCase() === 'audio' ) {
                        msg = { audio: { url: data.url }, mimetype: 'audio/mp4' };
                    }
                    
                    zk.sendMessage(origineMessage, msg, { quoted: ms });
                }
            } catch (error) {}
            
            // Anti-link
            try {
                const yes = await verifierEtatJid(origineMessage)
                if (texte && texte.includes('https://') && verifGroupe && yes) {
                    console.log("lien detecté")
                    var verifZokAdmin = verifGroupe ? admins.includes(idBot) : false;
                    
                    if(superUser || verifAdmin || !verifZokAdmin) { 
                        console.log('je fais rien'); 
                        return;
                    }
                    
                    const key = {
                        remoteJid: origineMessage,
                        fromMe: false,
                        id: ms.key.id,
                        participant: auteurMessage
                    };
                    
                    var txt = "lien detected, \n";
                    const gifLink = "https://raw.githubusercontent.com/djalega8000/Zokou-MD/main/media/remover.gif";
                    
                    var sticker = new Sticker(gifLink, {
                        pack: 'Zoou-Md',
                        author: conf.OWNER_NAME,
                        type: StickerTypes.FULL,
                        categories: ['🤩', '🎉'],
                        id: '12345',
                        quality: 50,
                        background: '#000000'
                    });
                    
                    await sticker.toFile("st1.webp");
                    var action = await recupererActionJid(origineMessage);
                    
                    if (action === 'remove') {
                        txt += `message deleted \n @${auteurMessage.split("@")[0]} removed from group.`;
                        await zk.sendMessage(origineMessage, { sticker: fs.readFileSync("st1.webp") });
                        (0, baileys_1.delay)(800);
                        await zk.sendMessage(origineMessage, { text: txt, mentions: [auteurMessage] }, { quoted: ms });
                        try {
                            await zk.groupParticipantsUpdate(origineMessage, [auteurMessage], "remove");
                        } catch (e) {
                            console.log("antiien ") + e;
                        }
                        await zk.sendMessage(origineMessage, { delete: key });
                        await fs.unlink("st1.webp");
                    } else if (action === 'delete') {
                        txt += `message deleted \n @${auteurMessage.split("@")[0]} avoid sending link.`;
                        await zk.sendMessage(origineMessage, { text: txt, mentions: [auteurMessage] }, { quoted: ms });
                        await zk.sendMessage(origineMessage, { delete: key });
                        await fs.unlink("st1.webp");
                    } else if(action === 'warn') {
                        const {getWarnCountByJID ,ajouterUtilisateurAvecWarnCount} = require('./bdd/warn') ;
                        let warn = await getWarnCountByJID(auteurMessage) ; 
                        let warnlimit = conf.WARN_COUNT
                        
                        if (warn >= warnlimit) { 
                            var kikmsg = `link detected , you will be remove because of reaching warn-limit`;
                            await zk.sendMessage(origineMessage, { text: kikmsg , mentions: [auteurMessage] }, { quoted: ms });
                            await zk.groupParticipantsUpdate(origineMessage, [auteurMessage], "remove");
                            await zk.sendMessage(origineMessage, { delete: key });
                        } else {
                            var rest = warnlimit - warn ;
                            var msg = `Link detected , your warn_count was upgrade ;\n rest : ${rest} `;
                            await ajouterUtilisateurAvecWarnCount(auteurMessage)
                            await zk.sendMessage(origineMessage, { text: msg , mentions: [auteurMessage] }, { quoted: ms }) ;
                            await zk.sendMessage(origineMessage, { delete: key });
                        }
                    }
                }
            } catch (e) {
                console.log("bdd err " + e);
            }
            
            // Anti-bot
            try {
                const botMsg = ms.key?.id?.startsWith('BAES') && ms.key?.id?.length === 16;
                const baileysMsg = ms.key?.id?.startsWith('BAE5') && ms.key?.id?.length === 16;
                
                if (botMsg || baileysMsg) {
                    if (mtype === 'reactionMessage') { 
                        console.log('Je ne reagis pas au reactions'); 
                        return;
                    }
                    
                    const antibotactiver = await atbverifierEtatJid(origineMessage);
                    if(!antibotactiver) return;
                    if(verifAdmin || auteurMessage === idBot) { 
                        console.log('je fais rien'); 
                        return;
                    }
                    
                    const key = {
                        remoteJid: origineMessage,
                        fromMe: false,
                        id: ms.key.id,
                        participant: auteurMessage
                    };
                    
                    var txt = "bot detected, \n";
                    const gifLink = "https://raw.githubusercontent.com/djalega8000/Zokou-MD/main/media/remover.gif";
                    
                    var sticker = new Sticker(gifLink, {
                        pack: 'Kibore md',
                        author: conf.OWNER_NAME,
                        type: StickerTypes.FULL,
                        categories: ['🤩', '🎉'],
                        id: '12345',
                        quality: 50,
                        background: '#000000'
                    });
                    
                    await sticker.toFile("st1.webp");
                    var action = await atbrecupererActionJid(origineMessage);
                    
                    if (action === 'remove') {
                        txt += `message deleted \n @${auteurMessage.split("@")[0]} removed from group.`;
                        await zk.sendMessage(origineMessage, { sticker: fs.readFileSync("st1.webp") });
                        (0, baileys_1.delay)(800);
                        await zk.sendMessage(origineMessage, { text: txt, mentions: [auteurMessage] }, { quoted: ms });
                        try {
                            await zk.groupParticipantsUpdate(origineMessage, [auteurMessage], "remove");
                        } catch (e) {
                            console.log("antibot ") + e;
                        }
                        await zk.sendMessage(origineMessage, { delete: key });
                        await fs.unlink("st1.webp");
                    } else if (action === 'delete') {
                        txt += `message delete \n @${auteurMessage.split("@")[0]} Avoid sending link.`;
                        await zk.sendMessage(origineMessage, { text: txt, mentions: [auteurMessage] }, { quoted: ms });
                        await zk.sendMessage(origineMessage, { delete: key });
                        await fs.unlink("st1.webp");
                    } else if(action === 'warn') {
                        const {getWarnCountByJID ,ajouterUtilisateurAvecWarnCount} = require('./bdd/warn') ;
                        let warn = await getWarnCountByJID(auteurMessage) ; 
                        let warnlimit = conf.WARN_COUNT
                        
                        if (warn >= warnlimit) { 
                            var kikmsg = `bot detected ;you will be remove because of reaching warn-limit`;
                            await zk.sendMessage(origineMessage, { text: kikmsg , mentions: [auteurMessage] }, { quoted: ms });
                            await zk.groupParticipantsUpdate(origineMessage, [auteurMessage], "remove");
                            await zk.sendMessage(origineMessage, { delete: key });
                        } else {
                            var rest = warnlimit - warn ;
                            var msg = `bot detected , your warn_count was upgrade ;\n rest : ${rest} `;
                            await ajouterUtilisateurAvecWarnCount(auteurMessage)
                            await zk.sendMessage(origineMessage, { text: msg , mentions: [auteurMessage] }, { quoted: ms }) ;
                            await zk.sendMessage(origineMessage, { delete: key });
                        }
                    }
                }
            } catch (er) {
                console.log('.... ' + er);
            }        
            
            // Execute commands
            if (verifCom) {
                const cd = evt.cm.find((zokou) => zokou.nomCom === (com));
                if (cd) {
                    try {
                        if ((conf.MODE).toLocaleLowerCase() != 'yes' && !superUser) {
                            return;
                        }
                        
                        if (!superUser && origineMessage === auteurMessage && conf.PM_PERMIT === "yes" ) {
                            repondre("You don't have acces to commands here");
                            return;
                        }
                        
                        if (!superUser && verifGroupe) {
                            let req = await isGroupBanned(origineMessage);
                            if (req) return;
                        }
                        
                        if(!verifAdmin && verifGroupe) {
                            let req = await isGroupOnlyAdmin(origineMessage);
                            if (req) return;
                        }
                        
                        if(!superUser) {
                            let req = await isUserBanned(auteurMessage);
                            if (req) {
                                repondre("You are banned from bot commands");
                                return;
                            }
                        }
                        
                        reagir(origineMessage, zk, ms, cd.reaction);
                        cd.fonction(origineMessage, zk, commandeOptions);
                    } catch (e) {
                        console.log("😡😡 " + e);
                        zk.sendMessage(origineMessage, { text: "😡😡 " + e }, { quoted: ms });
                    }
                }
            }
        });
        
        // Group participants update events
        const { recupevents } = require('./bdd/welcome'); 
        
        zk.ev.on('group-participants.update', async (group) => {
            console.log(group);
            
            let ppgroup;
            try {
                ppgroup = await zk.profilePictureUrl(group.id, 'image');
            } catch {
                ppgroup = '';
            }
            
            try {
                const metadata = await zk.groupMetadata(group.id);
                
                if (group.action == 'add' && (await recupevents(group.id, "welcome") == 'on')) {
                    let msg = `*𝐒𝐄𝐁𝐀𝐒𝐓𝐈𝐀𝐍 𝐌𝐃. 𝐖𝐄𝐋𝐂𝐎𝐌𝐄 𝐈𝐍 𝐓𝐇𝐄 𝐆𝐑𝐎𝐔𝐏 𝐌𝐄𝐒𝐒𝐀𝐆𝐄*`;
                    let membres = group.participants;
                    for (let membre of membres) {
                        msg += ` \n]|I{•------»*𝐇𝐄𝐘* 🖐️ @${membre.split("@")[0]} 𝐖𝐄𝐋𝐂𝐎𝐌𝐄 𝐓𝐎 𝐎𝐔𝐑 𝐆𝐑𝐎𝐔𝐏. \n\n`;
                    }
                    msg += `❒ *𝑅𝐸𝐴𝐷 𝑇𝐻𝐸 𝐺𝑅𝑂𝑈𝑃 𝐷𝐸𝑆𝐶𝑅𝐼𝑃𝑇𝐼𝑂𝑁 𝑇𝑂 𝐴𝑉𝑂𝐼𝐷 𝐺𝐸𝑇𝑇𝐼𝑁𝐺 𝑅𝐸𝑀𝑂𝑉𝐸𝐷 𝒚𝒐𝒖 🫩* `;
                    zk.sendMessage(group.id, { image: { url: ppgroup }, caption: msg, mentions: membres });
                    
                } else if (group.action == 'remove' && (await recupevents(group.id, "goodbye") == 'on')) {
                    let msg = `𝐎𝐍𝐄 𝐎𝐑 𝐒𝐎𝐌𝐄𝐒 𝐌𝐄𝐌𝐁𝐄𝐑(s) 𝐋𝐄𝐅𝐓 𝐆𝐑𝐎𝐔𝐏 🥲;\n`;
                    let membres = group.participants;
                    for (let membre of membres) {
                        msg += `@${membre.split("@")[0]}\n`;
                    }
                    zk.sendMessage(group.id, { text: msg, mentions: membres });
                    
                } else if (group.action == 'promote' && (await recupevents(group.id, "antipromote") == 'on') ) {
                    if (group.author == metadata.owner || group.author == conf.NUMERO_OWNER + '@s.whatsapp.net' || group.author == decodeJid(zk.user.id) || group.author == group.participants[0]) { 
                        console.log('Cas de superUser je fais rien');
                        return;
                    }
                    
                    await zk.groupParticipantsUpdate(group.id, [group.author, group.participants[0]], "demote");
                    
                    zk.sendMessage(group.id, {
                        text: `@${(group.author).split("@")[0]} has violated the anti-promotion rule, therefore both ${group.author.split("@")[0]} and @${(group.participants[0]).split("@")[0]} have been removed from administrative rights.`,
                        mentions: [group.author, group.participants[0]]
                    });
                    
                } else if (group.action == 'demote' && (await recupevents(group.id, "antidemote") == 'on') ) {
                    if (group.author == metadata.owner || group.author == conf.NUMERO_OWNER + '@s.whatsapp.net' || group.author == decodeJid(zk.user.id) || group.author == group.participants[0]) { 
                        console.log('Cas de superUser je fais rien');
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
                        console.log(`etablissement d'un automute pour ${crons[i].group_id} a ${set[0]} H ${set[1]}`);
                        
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
                        console.log(`etablissement d'un autounmute pour ${set[0]} H ${set[1]}`);
                        
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
                console.log('Les crons n\'ont pas été activés');
            }
            return;
        }
        
        // Contact events
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
        
        // Connection events
        zk.ev.on("connection.update", async (con) => {
            const { lastDisconnect, connection } = con;
            
            if (connection === "connecting") {
                console.log("ℹ️ SEBASTIAN MD is connecting...");
            }
            else if (connection === 'open') {
                console.log("✅ SEBASTIAN MD Connected to WhatsApp! ☺️");
                console.log("--");
                await (0, baileys_1.delay)(200);
                console.log("------");
                await (0, baileys_1.delay)(300);
                console.log("------------------/-----");
                console.log("SEBASTIAN MD is Online 🕸\n\n");
                
                console.log("Loading SEBASTIAN MD Commands ...\n");
                fs.readdirSync(__dirname + "/commandes").forEach((fichier) => {
                    if (path.extname(fichier).toLowerCase() == (".js")) {
                        try {
                            require(__dirname + "/commandes/" + fichier);
                            console.log(fichier + " Installed Successfully✔️");
                        } catch (e) {
                            console.log(`${fichier} could not be installed due to : ${e}`);
                        }
                        (0, baileys_1.delay)(300);
                    }
                });
                
                (0, baileys_1.delay)(700);
                
                var md;
                if ((conf.MODE).toLocaleLowerCase() === "yes") {
                    md = "public";
                } else if ((conf.MODE).toLocaleLowerCase() === "no") {
                    md = "private";
                } else {
                    md = "undefined";
                }
                
                console.log("Commands Installation Completed ✅");
                await activateCrons();
                
                if((conf.DP).toLowerCase() === 'yes') {     
                    let cmsg = `      SEBASTIAN MD
╭─────────────━┈⊷ 
│🌏 SEBASTIAN MD CONNECTED
│💫 ᴘʀᴇғɪx: *[ ${prefixe} ]*
│⭕ ᴍᴏᴅᴇ: *${md}*
│🛡️ ANTI-DELETE: *${conf.ANTI_DELETE_MESSAGE || conf.ADM || 'no'}*
╰─────────────━┈⊷⁠⁠⁠⁠`;
                    await zk.sendMessage(zk.user.id, { text: cmsg });
                }
            }
            else if (connection == "close") {
                let raisonDeconnexion = new boom_1.Boom(lastDisconnect?.error)?.output.statusCode;
                if (raisonDeconnexion === baileys_1.DisconnectReason.badSession) {
                    console.log('Session id error, rescan again...');
                } else if (raisonDeconnexion === baileys_1.DisconnectReason.connectionClosed) {
                    console.log('!!! connexion fermée, reconnexion en cours ...');
                    main();
                } else if (raisonDeconnexion === baileys_1.DisconnectReason.connectionLost) {
                    console.log('connection error 😞 ,,, trying to reconnect... ');
                    main();
                } else if (raisonDeconnexion === baileys_1.DisconnectReason?.connectionReplaced) {
                    console.log('connexion réplacée ,,, une sesssion est déjà ouverte veuillez la fermer svp !!!');
                } else if (raisonDeconnexion === baileys_1.DisconnectReason.loggedOut) {
                    console.log('vous êtes déconnecté,,, veuillez rescanner le code qr svp');
                } else if (raisonDeconnexion === baileys_1.DisconnectReason.restartRequired) {
                    console.log('redémarrage en cours ▶️');
                    main();
                } else {
                    console.log('redemarrage sur le coup de l\'erreur  ', raisonDeconnexion);         
                    const { exec } = require("child_process");
                    exec("pm2 restart all");            
                }
                console.log("hum " + connection);
                main();
            }
        });
        
        // Auth events
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
            await fs.writeFileSync(trueFileName, buffer);
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
