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

// ==================== IMPORTS ====================
const baileys_1 = __importStar(require("@whiskeysockets/baileys"));
const logger_1 = __importDefault(require("@whiskeysockets/baileys/lib/Utils/logger"));
const logger = logger_1.default.child({});
logger.level = 'silent';

const pino = require("pino");
const boom_1 = require("@hapi/boom");
const conf = require("./set");
const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const FileType = require('file-type');
const { Sticker, createSticker, StickerTypes } = require('wa-sticker-formatter');
const cron = require('node-cron');

// ==================== DATABASE IMPORTS ====================
const { verifierEtatJid, recupererActionJid } = require("./bdd/antilien");
const { atbverifierEtatJid, atbrecupererActionJid } = require("./bdd/antibot");
const { isUserBanned, addUserToBanList, removeUserFromBanList } = require("./bdd/banUser");
const { addGroupToBanList, isGroupBanned, removeGroupFromBanList } = require("./bdd/banGroup");
const { isGroupOnlyAdmin, addGroupToOnlyAdminList, removeGroupFromOnlyAdminList } = require("./bdd/onlyAdmin");
const { getAllSudoNumbers } = require("./bdd/sudo");
const { ajouterOuMettreAJourUserData } = require("./bdd/level");
const { getWarnCountByJID, ajouterUtilisateurAvecWarnCount } = require('./bdd/warn');
const { recupevents } = require('./bdd/welcome');
const { getCron } = require('./bdd/cron');
const mbd = require('./bdd/mention');

// ==================== FRAMEWORK IMPORTS ====================
let evt = require(__dirname + "/framework/zokou");
let { reagir } = require(__dirname + "/framework/app");

// ==================== CONFIGURATION ====================
var session = conf.session.replace(/Zokou-MD-WHATSAPP-BOT;;;=>/g, "");
const prefixe = conf.PREFIXE;
const more = String.fromCharCode(8206);
const readmore = more.repeat(4001);

// ==================== EXPRESS SERVER ====================
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));
app.listen(PORT, () => {
    console.log(`🌐 Server is running at http://localhost:${PORT}`);
});

// ==================== SESSION AUTHENTIFICATION ====================
async function authentification() {
    try {
        if (!fs.existsSync(__dirname + "/scan/creds.json")) {
            console.log("📱 Connexion en cours ...");
            await fs.writeFileSync(__dirname + "/scan/creds.json", atob(session), "utf8");
        } else if (fs.existsSync(__dirname + "/scan/creds.json") && session != "zokk") {
            await fs.writeFileSync(__dirname + "/scan/creds.json", atob(session), "utf8");
        }
    } catch (e) {
        console.log("❌ Session Invalid: " + e);
        return;
    }
}
authentification();

// ==================== STORE SETUP ====================
const store = (0, baileys_1.makeInMemoryStore)({
    logger: pino().child({ level: "silent", stream: "store" }),
});

// ==================== EMOJI MAP FOR AUTO-REACT ====================
const emojiMap = {
    "hello": ["👋", "😊", "🙂", "👋🏻"],
    "hi": ["👋", "😊", "😁", "👋🏻"],
    "good morning": ["🌅", "🌞", "☀️", "🌻"],
    "good night": ["🌙", "🌜", "⭐", "💫"],
    "bye": ["👋", "😢", "👋🏻", "🥲"],
    "thanks": ["🙏", "😊", "💖", "❤️"],
    "thank you": ["🙏", "😊", "🙌", "💖"],
    "love": ["❤️", "💖", "💘", "😍", "💑"],
    "sorry": ["😔", "🙏", "💔", "🥺"],
    "congrats": ["🎉", "🎊", "🏆", "👏"],
    "good job": ["👏", "💪", "👍", "🎉"],
    "happy": ["😁", "😊", "🎉", "🎊"],
    "sad": ["😢", "😭", "😞", "💔"],
    "angry": ["😡", "🤬", "😤", "💢"],
    "help": ["🆘", "❓", "🙏", "💡"],
    "party": ["🎉", "🥳", "🍾", "🎤"],
    "fun": ["🤣", "😂", "🥳", "🎮"],
    "cool": ["😎", "👌", "🔥", "💥"],
    "bot": ["🤖", "💻", "⚙️", "🧠"],
    "welcome": ["😊", "😄", "🌸", "🙂"],
    "miss you": ["😢", "💔", "😭", "💖"],
    "good": ["👍", "👌", "😊", "💯"],
    "awesome": ["🔥", "🚀", "🤩", "👏"],
    "boring": ["😴", "🥱", "🙄", "😑"],
    "tired": ["😴", "🥱", "😌", "💤"],
    "work": ["💻", "🖥️", "💼", "📝"],
    "school": ["📚", "🏫", "🎒", "👨‍🏫"],
    "food": ["🍕", "🍔", "🍟", "🍣"],
    "coffee": ["☕", "🥤", "🍵", "🫖"],
    "water": ["💧", "💦", "🌊", "🥤"],
    "pizza": ["🍕", "🍟", "🥖", "🍔"],
    "dog": ["🐶", "🐕", "🐾", "🦮"],
    "cat": ["🐱", "😺", "🐈", "🐾"],
    "bird": ["🐦", "🦅", "🐧", "🦜"],
    "fish": ["🐟", "🐠", "🐡", "🐬"],
    "rain": ["🌧️", "☔", "💧", "🌈"],
    "sun": ["☀️", "🌞", "🌅", "🌄"],
    "moon": ["🌙", "🌜", "🌛", "⭐"],
    "star": ["⭐", "🌟", "✨", "💫"],
    "fire": ["🔥", "💥", "⚡", "🌋"],
    "money": ["💰", "💵", "💸", "💳"],
    "car": ["🚗", "🚘", "🚙", "🏎️"],
    "phone": ["📱", "📲", "☎️", "📞"],
    "computer": ["💻", "🖥️", "⌨️", "🖱️"],
    "music": ["🎵", "🎶", "🎧", "🎤"],
    "game": ["🎮", "🕹️", "🎲", "🎯"],
    "birthday": ["🎂", "🎉", "🎁", "🎈"],
    "christmas": ["🎄", "🎅", "🎁", "⛄"],
    "new year": ["🎉", "🎊", "🎇", "🍾"],
    "valentine": ["❤️", "💘", "💌", "🌹"],
    "peace": ["✌️", "🕊️", "☮️", "🤞"],
    "strong": ["💪", "🏋️", "🔥", "⚡"],
    "smart": ["🧠", "🤓", "💡", "📚"],
    "beautiful": ["🌸", "💖", "👑", "✨"],
    "handsome": ["😎", "👔", "💼", "👑"]
};

const fallbackEmojis = [
    "😎", "🔥", "💥", "💯", "✨", "🌟", "🌈", "⚡", "💎", "🌀",
    "👑", "🎉", "🎊", "🦄", "👽", "🛸", "🚀", "🦋", "💫", "🍀",
    "🎶", "🎧", "🎸", "🎤", "🏆", "🏅", "🌍", "🎮", "🎲", "💪",
    "🥇", "👟", "🏃", "🚴", "🚶", "🏄", "⛷️", "🕶️", "🧳", "🍿",
    "🥂", "🍻", "🍷", "🍸", "🥃", "🍾", "🎯", "⏳", "🎁", "🎈"
];

const getEmojiForSentence = (sentence) => {
    const words = sentence.toLowerCase().split(/\s+/);
    for (const word of words) {
        if (emojiMap[word]) {
            return emojiMap[word][Math.floor(Math.random() * emojiMap[word].length)];
        }
    }
    return fallbackEmojis[Math.floor(Math.random() * fallbackEmojis.length)];
};

// ==================== UTILITY FUNCTIONS ====================
const decodeJid = (jid) => {
    if (!jid) return jid;
    if (/:\d+@/gi.test(jid)) {
        let decode = (0, baileys_1.jidDecode)(jid) || {};
        return decode.user && decode.server && decode.user + '@' + decode.server || jid;
    } else return jid;
};

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// ==================== MAIN BOT FUNCTION ====================
setTimeout(() => {
    async function main() {
        const { version, isLatest } = await (0, baileys_1.fetchLatestBaileysVersion)();
        const { state, saveCreds } = await (0, baileys_1.useMultiFileAuthState)(__dirname + "/scan");

        const sockOptions = {
            version,
            logger: pino({ level: "silent" }),
            browser: ['SEBASTIAN MD', "safari", "3.0.0"],
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
                    return msg?.message || undefined;
                }
                return { conversation: '❌ Error Occurred!' };
            }
        };

        const zk = (0, baileys_1.default)(sockOptions);
        store.bind(zk.ev);

        // ==================== RATE LIMITING ====================
        const rateLimit = new Map();
        const groupMetadataCache = new Map();

        function isRateLimited(jid) {
            const now = Date.now();
            if (!rateLimit.has(jid)) {
                rateLimit.set(jid, now);
                return false;
            }
            const lastRequestTime = rateLimit.get(jid);
            if (now - lastRequestTime < 3000) return true;
            rateLimit.set(jid, now);
            return false;
        }

        async function getGroupMetadata(zk, groupId) {
            if (groupMetadataCache.has(groupId)) {
                return groupMetadataCache.get(groupId);
            }
            try {
                const metadata = await zk.groupMetadata(groupId);
                groupMetadataCache.set(groupId, metadata);
                setTimeout(() => groupMetadataCache.delete(groupId), 60000);
                return metadata;
            } catch (error) {
                if (error.message.includes("rate-overlimit")) {
                    await delay(5000);
                }
                return null;
            }
        }

        // ==================== ERROR HANDLING ====================
        process.on("uncaughtException", (err) => {});
        process.on("unhandledRejection", (err) => {});

        // ==================== ANTI-DELETE FEATURE ====================
        if (conf.ANTIDELETE1 === "yes") {
            zk.ev.on("messages.upsert", async (m) => {
                const { messages } = m;
                const ms = messages[0];
                if (!ms.message) return;

                const messageKey = ms.key;
                const remoteJid = messageKey.remoteJid;

                if (!store.chats[remoteJid]) {
                    store.chats[remoteJid] = [];
                }
                store.chats[remoteJid].push(ms);

                if (ms.message.protocolMessage && ms.message.protocolMessage.type === 0) {
                    const deletedKey = ms.message.protocolMessage.key;
                    const chatMessages = store.chats[remoteJid];
                    const deletedMessage = chatMessages.find(msg => msg.key.id === deletedKey.id);

                    if (deletedMessage) {
                        try {
                            const participant = deletedMessage.key.participant || deletedMessage.key.remoteJid;
                            const notification = `*🛑 Message deleted by @${participant.split("@")[0]}*`;
                            const botOwnerJid = `${conf.NUMERO_OWNER}@s.whatsapp.net`;

                            if (deletedMessage.message.conversation) {
                                await zk.sendMessage(botOwnerJid, {
                                    text: `${notification}\n📝 Content: ${deletedMessage.message.conversation}`,
                                    mentions: [participant],
                                });
                            } else if (deletedMessage.message.imageMessage) {
                                const caption = deletedMessage.message.imageMessage.caption || '';
                                const imagePath = await zk.downloadAndSaveMediaMessage(deletedMessage.message.imageMessage);
                                await zk.sendMessage(botOwnerJid, {
                                    image: { url: imagePath },
                                    caption: `${notification}\n${caption}`,
                                    mentions: [participant],
                                });
                            } else if (deletedMessage.message.videoMessage) {
                                const caption = deletedMessage.message.videoMessage.caption || '';
                                const videoPath = await zk.downloadAndSaveMediaMessage(deletedMessage.message.videoMessage);
                                await zk.sendMessage(botOwnerJid, {
                                    video: { url: videoPath },
                                    caption: `${notification}\n${caption}`,
                                    mentions: [participant],
                                });
                            }
                        } catch (error) {
                            console.error('Error in antidelete:', error);
                        }
                    }
                }
            });
        }

        // ==================== AUTO-REACT STATUS ====================
        let lastReactionTime = 0;

        if (conf.AUTO_REACT_STATUS === "yes") {
            console.log("✅ AUTO_REACT_STATUS enabled");
            zk.ev.on("messages.upsert", async (m) => {
                const { messages } = m;
                for (const message of messages) {
                    if (message.key && message.key.remoteJid === "status@broadcast") {
                        const now = Date.now();
                        if (now - lastReactionTime < 5000) continue;

                        const botJid = zk.user?.id ? zk.user.id.split(":")[0] + "@s.whatsapp.net" : null;
                        if (!botJid) continue;

                        await zk.sendMessage(message.key.remoteJid, {
                            react: {
                                key: message.key,
                                text: "❤",
                            },
                        }, {
                            statusJidList: [message.key.participant, botJid],
                        });

                        lastReactionTime = Date.now();
                        await delay(2000);
                    }
                }
            });
        }

        // ==================== AUTO-REACT MESSAGES ====================
        if (conf.AUTO_REACT === "yes") {
            console.log("✅ AUTO_REACT enabled");
            zk.ev.on("messages.upsert", async (m) => {
                const { messages } = m;
                for (const message of messages) {
                    if (message.key && message.key.remoteJid) {
                        const now = Date.now();
                        if (now - lastReactionTime < 5000) continue;

                        const conversationText = message?.message?.conversation || 
                                               message?.message?.extendedTextMessage?.text || "";
                        
                        if (conversationText) {
                            const randomEmoji = getEmojiForSentence(conversationText);
                            
                            await zk.sendMessage(message.key.remoteJid, {
                                react: {
                                    text: randomEmoji,
                                    key: message.key
                                }
                            }).catch(err => {});

                            lastReactionTime = Date.now();
                            await delay(2000);
                        }
                    }
                }
            });
        }

        // ==================== VCARD COMMAND ====================
        zk.ev.on("messages.upsert", async (m) => {
            const { messages } = m;
            const ms = messages[0];

            if (!ms.message) return;

            const messageContent = ms.message.conversation || ms.message.extendedTextMessage?.text || '';
            const sender = ms.key.remoteJid;

            if (messageContent.slice(1).toLowerCase() === "vcf" && sender.endsWith("@g.us")) {
                const baseName = "BMB Family";
                await createAndSendGroupVCard(sender, baseName, zk);
            }
        });

        // ==================== ANTI-CALL FEATURE ====================
        zk.ev.on("call", async (callData) => {
            if (conf.ANTICALL === 'yes') {
                const callId = callData[0].id;
                const callerId = callData[0].from;

                await zk.rejectCall(callId, callerId);

                setTimeout(async () => {
                    await zk.sendMessage(callerId, {
                        text: `🚫 *Call Rejected!*\n\nHi, I'm *SEBASTIAN MD Bot* 🤖.\nMy owner is unavailable.\nPlease text instead. Thanks! 😊`
                    });
                }, 1000);
            }
        });

        // ==================== MAIN MESSAGE HANDLER ====================
        zk.ev.on("messages.upsert", async (m) => {
            const { messages } = m;
            const ms = messages[0];
            
            if (!ms.message) return;

            // ==================== DECODE JID ====================
            const decodeJid = (jid) => {
                if (!jid) return jid;
                if (/:\d+@/gi.test(jid)) {
                    let decode = (0, baileys_1.jidDecode)(jid) || {};
                    return decode.user && decode.server && decode.user + '@' + decode.server || jid;
                }
                return jid;
            };

            // ==================== MESSAGE TYPE ====================
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
            var mr = ms.message?.extendedTextMessage?.contextInfo?.mentionedJid;
            var utilisateur = mr ? mr : msgRepondu ? auteurMsgRepondu : "";
            var auteurMessage = verifGroupe ? (ms.key.participant ? ms.key.participant : ms.participant) : origineMessage;
            
            if (ms.key.fromMe) {
                auteurMessage = idBot;
            }
            
            var membreGroupe = verifGroupe ? ms.key.participant : '';
            const nomAuteurMessage = ms.pushName;
            
            // ==================== SUDO & SUPERUSER ====================
            const sudo = await getAllSudoNumbers();
            const superUserNumbers = [servBot, conf.NUMERO_OWNER].map((s) => s.replace(/[^0-9]/g) + "@s.whatsapp.net");
            const allAllowedNumbers = superUserNumbers.concat(sudo);
            const superUser = allAllowedNumbers.includes(auteurMessage);
            
            var dev = [conf.NUMERO_OWNER].map((t) => t.replace(/[^0-9]/g) + "@s.whatsapp.net").includes(auteurMessage);

            // ==================== REPLY FUNCTION ====================
            function repondre(mes) { 
                zk.sendMessage(origineMessage, { text: mes }, { quoted: ms }); 
            }

            // ==================== CONSOLE LOG ====================
            console.log("\n🌍 SEBASTIAN MD ONLINE 🌍");
            console.log("📝 =========== NEW MESSAGE ===========");
            if (verifGroupe) {
                console.log("👥 Group: " + nomGroupe);
            }
            console.log("👤 From: " + "[" + nomAuteurMessage + " : " + auteurMessage.split("@s.whatsapp.net")[0] + " ]");
            console.log("📌 Type: " + mtype);
            console.log("💬 Content: " + texte);

            // ==================== GROUP ADMIN FUNCTION ====================
            function groupeAdmin(membreGroupe) {
                let admin = [];
                for (let m of membreGroupe) {
                    if (m.admin == null) continue;
                    admin.push(m.id);
                }
                return admin;
            }

            // ==================== PRESENCE UPDATE ====================
            var etat = conf.ETAT;
            if (etat == 1) {
                await zk.sendPresenceUpdate("available", origineMessage);
            } else if (etat == 2) {
                await zk.sendPresenceUpdate("composing", origineMessage);
            } else if (etat == 3) {
                await zk.sendPresenceUpdate("recording", origineMessage);
            } else {
                await zk.sendPresenceUpdate("unavailable", origineMessage);
            }

            // ==================== GROUP PARTICIPANTS ====================
            const mbre = verifGroupe ? await infosGroupe.participants : '';
            let admins = verifGroupe ? groupeAdmin(mbre) : '';
            const verifAdmin = verifGroupe ? admins.includes(auteurMessage) : false;
            var verifZokouAdmin = verifGroupe ? admins.includes(idBot) : false;

            // ==================== COMMAND PARSING ====================
            const arg = texte ? texte.trim().split(/ +/).slice(1) : null;
            const verifCom = texte ? texte.startsWith(prefixe) : false;
            const com = verifCom ? texte.slice(1).trim().split(/ +/).shift().toLowerCase() : false;

            // ==================== RANDOM IMAGE FUNCTION ====================
            const lien = conf.URL ? conf.URL.split(',') : [];
            function mybotpic() {
                if (lien.length === 0) return '';
                const indiceAleatoire = Math.floor(Math.random() * lien.length);
                return lien[indiceAleatoire];
            }

            // ==================== COMMAND OPTIONS ====================
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

            // ==================== AUTO READ ====================
            if (conf.AUTO_READ === 'yes') {
                if (!ms.key.fromMe) {
                    await zk.readMessages([ms.key]);
                }
            }

            // ==================== AUTO READ STATUS ====================
            if (ms.key && ms.key.remoteJid === "status@broadcast" && conf.AUTO_READ_STATUS === "yes") {
                await zk.readMessages([ms.key]);
            }

            // ==================== AUTO DOWNLOAD STATUS ====================
            if (ms.key && ms.key.remoteJid === 'status@broadcast' && conf.AUTO_DOWNLOAD_STATUS === "yes") {
                if (ms.message.extendedTextMessage) {
                    var stTxt = ms.message.extendedTextMessage.text;
                    await zk.sendMessage(idBot, { text: stTxt }, { quoted: ms });
                } else if (ms.message.imageMessage) {
                    var stMsg = ms.message.imageMessage.caption;
                    var stImg = await zk.downloadAndSaveMediaMessage(ms.message.imageMessage);
                    await zk.sendMessage(idBot, { image: { url: stImg }, caption: stMsg }, { quoted: ms });
                } else if (ms.message.videoMessage) {
                    var stMsg = ms.message.videoMessage.caption;
                    var stVideo = await zk.downloadAndSaveMediaMessage(ms.message.videoMessage);
                    await zk.sendMessage(idBot, { video: { url: stVideo }, caption: stMsg }, { quoted: ms });
                }
            }

            // ==================== LEVEL SYSTEM ====================
            if (texte && auteurMessage.endsWith("s.whatsapp.net")) {
                try {
                    await ajouterOuMettreAJourUserData(auteurMessage);
                } catch (e) {
                    console.error(e);
                }
            }

            // ==================== MENTIONS HANDLER ====================
            try {
                if (ms.message[mtype]?.contextInfo?.mentionedJid && 
                    (ms.message[mtype].contextInfo.mentionedJid.includes(idBot) || 
                     ms.message[mtype].contextInfo.mentionedJid.includes(conf.NUMERO_OWNER + '@s.whatsapp.net'))) {
                    
                    if (origineMessage == "120363353854480831@newsletter") return;
                    if (superUser) return;

                    let alldata = await mbd.recupererToutesLesValeurs();
                    let data = alldata[0];

                    if (data?.status === 'non') return;

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

                    if (msg) {
                        zk.sendMessage(origineMessage, msg, { quoted: ms });
                    }
                }
            } catch (error) {}

            // ==================== ANTI-LIEN ====================
            try {
                const yes = await verifierEtatJid(origineMessage);
                if (texte && texte.includes('https://') && verifGroupe && yes) {
                    console.log("🔗 Lien detecté");
                    
                    if (superUser || verifAdmin || !verifZokouAdmin) return;

                    const key = {
                        remoteJid: origineMessage,
                        fromMe: false,
                        id: ms.key.id,
                        participant: auteurMessage
                    };

                    var txt = "🚫 *Lien detecté!*\n";
                    const gifLink = "https://raw.githubusercontent.com/djalega8000/Zokou-MD/main/media/remover.gif";
                    
                    var sticker = new Sticker(gifLink, {
                        pack: 'BMB-XMD',
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
                        txt += `🚫 Message supprimé\n👤 @${auteurMessage.split("@")[0]} retiré du groupe.`;

                        await zk.sendMessage(origineMessage, { sticker: fs.readFileSync("st1.webp") });
                        await delay(800);
                        await zk.sendMessage(origineMessage, { text: txt, mentions: [auteurMessage] }, { quoted: ms });
                        
                        try {
                            await zk.groupParticipantsUpdate(origineMessage, [auteurMessage], "remove");
                        } catch (e) {}
                        
                        await zk.sendMessage(origineMessage, { delete: key });
                        await fs.unlink("st1.webp");
                    } else if (action === 'delete') {
                        txt += `🚫 Message supprimé\n👤 @${auteurMessage.split("@")[0]} éviter les liens.`;
                        
                        await zk.sendMessage(origineMessage, { text: txt, mentions: [auteurMessage] }, { quoted: ms });
                        await zk.sendMessage(origineMessage, { delete: key });
                        await fs.unlink("st1.webp");
                    } else if (action === 'warn') {
                        let warn = await getWarnCountByJID(auteurMessage);
                        let warnlimit = conf.WARN_COUNT || 3;
                        
                        if (warn >= warnlimit) {
                            var kikmsg = `🚫 Lien detecté! Vous avez atteint la limite d'avertissements.`;
                            await zk.sendMessage(origineMessage, { text: kikmsg, mentions: [auteurMessage] }, { quoted: ms });
                            await zk.groupParticipantsUpdate(origineMessage, [auteurMessage], "remove");
                            await zk.sendMessage(origineMessage, { delete: key });
                        } else {
                            var rest = warnlimit - warn;
                            var msg = `🚫 Lien detecté! Avertissement ${warn + 1}/${warnlimit}`;
                            await ajouterUtilisateurAvecWarnCount(auteurMessage);
                            await zk.sendMessage(origineMessage, { text: msg, mentions: [auteurMessage] }, { quoted: ms });
                            await zk.sendMessage(origineMessage, { delete: key });
                        }
                    }
                    await fs.unlink("st1.webp").catch(() => {});
                }
            } catch (e) {
                console.log("Anti-lien error: " + e);
            }

            // ==================== ANTI-BOT ====================
            try {
                const botMsg = ms.key?.id?.startsWith('BAES') && ms.key?.id?.length === 16;
                const baileysMsg = ms.key?.id?.startsWith('BAE5') && ms.key?.id?.length === 16;
                
                if ((botMsg || baileysMsg) && mtype !== 'reactionMessage') {
                    const antibotactiver = await atbverifierEtatJid(origineMessage);
                    if (!antibotactiver || verifAdmin || auteurMessage === idBot) return;

                    const key = {
                        remoteJid: origineMessage,
                        fromMe: false,
                        id: ms.key.id,
                        participant: auteurMessage
                    };

                    var txt = "🤖 *Bot detecté!*\n";
                    const gifLink = "https://raw.githubusercontent.com/djalega8000/Zokou-MD/main/media/remover.gif";
                    
                    var sticker = new Sticker(gifLink, {
                        pack: 'SEBASTIAN MD',
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
                        txt += `🚫 Message supprimé\n👤 @${auteurMessage.split("@")[0]} retiré du groupe.`;

                        await zk.sendMessage(origineMessage, { sticker: fs.readFileSync("st1.webp") });
                        await delay(800);
                        await zk.sendMessage(origineMessage, { text: txt, mentions: [auteurMessage] }, { quoted: ms });
                        
                        try {
                            await zk.groupParticipantsUpdate(origineMessage, [auteurMessage], "remove");
                        } catch (e) {}
                        
                        await zk.sendMessage(origineMessage, { delete: key });
                        await fs.unlink("st1.webp");
                    } else if (action === 'delete') {
                        txt += `🚫 Message supprimé\n👤 @${auteurMessage.split("@")[0]} éviter les bots.`;
                        
                        await zk.sendMessage(origineMessage, { text: txt, mentions: [auteurMessage] }, { quoted: ms });
                        await zk.sendMessage(origineMessage, { delete: key });
                        await fs.unlink("st1.webp");
                    } else if (action === 'warn') {
                        let warn = await getWarnCountByJID(auteurMessage);
                        let warnlimit = conf.WARN_COUNT || 3;
                        
                        if (warn >= warnlimit) {
                            var kikmsg = `🤖 Bot detecté! Vous avez atteint la limite d'avertissements.`;
                            await zk.sendMessage(origineMessage, { text: kikmsg, mentions: [auteurMessage] }, { quoted: ms });
                            await zk.groupParticipantsUpdate(origineMessage, [auteurMessage], "remove");
                            await zk.sendMessage(origineMessage, { delete: key });
                        } else {
                            var rest = warnlimit - warn;
                            var msg = `🤖 Bot detecté! Avertissement ${warn + 1}/${warnlimit}`;
                            await ajouterUtilisateurAvecWarnCount(auteurMessage);
                            await zk.sendMessage(origineMessage, { text: msg, mentions: [auteurMessage] }, { quoted: ms });
                            await zk.sendMessage(origineMessage, { delete: key });
                        }
                    }
                    await fs.unlink("st1.webp").catch(() => {});
                }
            } catch (er) {
                console.log('Anti-bot error: ' + er);
            }

            // ==================== COMMAND EXECUTION ====================
            if (verifCom) {
                const cd = evt.cm.find((zokou) => zokou.nomCom === com);
                if (cd) {
                    try {
                        // MODE CHECK
                        if (conf.MODE.toLowerCase() != 'yes' && !superUser) {
                            return;
                        }

                        // PM PERMIT
                        if (!superUser && origineMessage === auteurMessage && conf.PM_PERMIT === "yes") {
                            repondre("❌ You don't have access to commands here");
                            return;
                        }

                        // GROUP BAN CHECK
                        if (!superUser && verifGroupe) {
                            let req = await isGroupBanned(origineMessage);
                            if (req) return;
                        }

                        // ONLY ADMIN CHECK
                        if (!verifAdmin && verifGroupe) {
                            let req = await isGroupOnlyAdmin(origineMessage);
                            if (req) return;
                        }

                        // USER BAN CHECK
                        if (!superUser) {
                            let req = await isUserBanned(auteurMessage);
                            if (req) {
                                repondre("❌ You are banned from bot commands");
                                return;
                            }
                        }

                        // EXECUTE COMMAND
                        if (cd.reaction) {
                            reagir(origineMessage, zk, ms, cd.reaction);
                        }
                        cd.fonction(origineMessage, zk, commandeOptions);
                    } catch (e) {
                        console.log("❌ Command error: " + e);
                        zk.sendMessage(origineMessage, { text: "❌ Error: " + e }, { quoted: ms });
                    }
                }
            }
        });

        // ==================== GROUP PARTICIPANTS UPDATE ====================
        zk.ev.on('group-participants.update', async (group) => {
            console.log('Group update:', group);

            let ppgroup;
            try {
                ppgroup = await zk.profilePictureUrl(group.id, 'image');
            } catch {
                ppgroup = '';
            }

            try {
                const metadata = await zk.groupMetadata(group.id);

                if (group.action == 'add' && (await recupevents(group.id, "welcome") == 'on')) {
                    let msg = `*SEBASTIAN MD WELCOME* 🎉\n\n`;
                    let membres = group.participants;
                    for (let membre of membres) {
                        msg += `👋 Welcome @${membre.split("@")[0]} to the group!\n\n`;
                    }
                    msg += `📌 *Read group description to avoid issues.*`;

                    zk.sendMessage(group.id, { 
                        image: { url: ppgroup || 'https://i.imgur.com/placeholder.jpg' }, 
                        caption: msg, 
                        mentions: membres 
                    });
                } else if (group.action == 'remove' && (await recupevents(group.id, "goodbye") == 'on')) {
                    let msg = `👋 *Goodbye!*\n\n`;
                    let membres = group.participants;
                    for (let membre of membres) {
                        msg += `@${membre.split("@")[0]} left the group.\n`;
                    }
                    zk.sendMessage(group.id, { text: msg, mentions: membres });
                } else if (group.action == 'promote' && (await recupevents(group.id, "antipromote") == 'on')) {
                    if (group.author == metadata.owner || group.author == conf.NUMERO_OWNER + '@s.whatsapp.net' || group.author == decodeJid(zk.user.id)) return;

                    await zk.groupParticipantsUpdate(group.id, [group.author, group.participants[0]], "demote");
                    zk.sendMessage(group.id, {
                        text: `🚫 @${group.author.split("@")[0]} violated anti-promote rule. Both demoted.`,
                        mentions: [group.author, group.participants[0]]
                    });
                } else if (group.action == 'demote' && (await recupevents(group.id, "antidemote") == 'on')) {
                    if (group.author == metadata.owner || group.author == conf.NUMERO_OWNER + '@s.whatsapp.net' || group.author == decodeJid(zk.user.id)) return;

                    await zk.groupParticipantsUpdate(group.id, [group.author], "demote");
                    await zk.groupParticipantsUpdate(group.id, [group.participants[0]], "promote");
                    zk.sendMessage(group.id, {
                        text: `🚫 @${group.author.split("@")[0]} violated anti-demote rule.`,
                        mentions: [group.author, group.participants[0]]
                    });
                }
            } catch (e) {
                console.error('Group update error:', e);
            }
        });

        // ==================== CRON JOBS ====================
        async function activateCrons() {
            let crons = await getCron();
            console.log('Crons:', crons);
            
            if (crons.length > 0) {
                for (let i = 0; i < crons.length; i++) {
                    if (crons[i].mute_at != null) {
                        let set = crons[i].mute_at.split(':');
                        console.log(`Setting auto-mute for ${crons[i].group_id} at ${set[0]}:${set[1]}`);

                        cron.schedule(`${set[1]} ${set[0]} * * *`, async () => {
                            await zk.groupSettingUpdate(crons[i].group_id, 'announcement');
                            zk.sendMessage(crons[i].group_id, { 
                                image: { url: './media/chrono.webp' }, 
                                caption: "🔒 Group closed. Sayonara!" 
                            });
                        }, { timezone: "Africa/Nairobi" });
                    }

                    if (crons[i].unmute_at != null) {
                        let set = crons[i].unmute_at.split(':');
                        console.log(`Setting auto-unmute at ${set[0]}:${set[1]}`);

                        cron.schedule(`${set[1]} ${set[0]} * * *`, async () => {
                            await zk.groupSettingUpdate(crons[i].group_id, 'not_announcement');
                            zk.sendMessage(crons[i].group_id, { 
                                image: { url: './media/chrono.webp' }, 
                                caption: "🔓 Group opened. Good morning!" 
                            });
                        }, { timezone: "Africa/Nairobi" });
                    }
                }
            } else {
                console.log('No crons activated');
            }
        }

        // ==================== CONTACTS UPSERT ====================
        zk.ev.on("contacts.upsert", async (contacts) => {
            const insertContact = (newContact) => {
                for (const contact of newContact) {
                    if (store.contacts[contact.id]) {
                        Object.assign(store.contacts[contact.id], contact);
                    } else {
                        store.contacts[contact.id] = contact;
                    }
                }
            };
            insertContact(contacts);
        });

        // ==================== CONNECTION UPDATE ====================
        zk.ev.on("connection.update", async (con) => {
            const { lastDisconnect, connection } = con;
            
            if (connection === "connecting") {
                console.log("📱 SEBASTIAN MD is connecting...");
            } else if (connection === 'open') {
                console.log("✅ SEBASTIAN MD Connected to WhatsApp!");
                await delay(200);
                console.log("Loading commands...");

                // Load commands
                fs.readdirSync(__dirname + "/commandes").forEach((fichier) => {
                    if (path.extname(fichier).toLowerCase() == ".js") {
                        try {
                            require(__dirname + "/commandes/" + fichier);
                            console.log(`✅ ${fichier} loaded`);
                        } catch (e) {
                            console.log(`❌ ${fichier} error: ${e}`);
                        }
                        delay(100);
                    }
                });

                await activateCrons();

                // Send startup message
                if (conf.DP?.toLowerCase() === 'yes') {
                    let mode = conf.MODE.toLowerCase() === 'yes' ? 'public' : 'private';
                    let cmsg = `╭─────────────━┈⊷\n│🌍 *SEBASTIAN MD CONNECTED* 🌍\n╰─────────────━┈⊷\n│📌 Prefix: *[ ${prefixe} ]*\n│⚡ Mode: *${mode}*\n│🤖 Bot: BMB-XMD\n╰─────────────━┈⊷\n\n> Powered by Sebastian Md`;
                    await zk.sendMessage(zk.user.id, { text: cmsg });
                }
            } else if (connection == "close") {
                let raisonDeconnexion = new boom_1.Boom(lastDisconnect?.error)?.output.statusCode;
                
                if (raisonDeconnexion === baileys_1.DisconnectReason.badSession) {
                    console.log('❌ Bad session, rescan QR...');
                } else if (raisonDeconnexion === baileys_1.DisconnectReason.connectionClosed) {
                    console.log('⚠️ Connection closed, reconnecting...');
                    main();
                } else if (raisonDeconnexion === baileys_1.DisconnectReason.connectionLost) {
                    console.log('⚠️ Connection lost, reconnecting...');
                    main();
                } else if (raisonDeconnexion === baileys_1.DisconnectReason.loggedOut) {
                    console.log('❌ Logged out, scan QR again');
                } else if (raisonDeconnexion === baileys_1.DisconnectReason.restartRequired) {
                    console.log('🔄 Restarting...');
                    main();
                } else {
                    console.log('⚠️ Unknown error, reconnecting...', raisonDeconnexion);
                    main();
                }
            }
        });

        // ==================== CREDS UPDATE ====================
        zk.ev.on("creds.update", saveCreds);

        // ==================== UTILITY FUNCTIONS ====================
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

    // ==================== FILE WATCHER ====================
    let fichier = require.resolve(__filename);
    fs.watchFile(fichier, () => {
        fs.unwatchFile(fichier);
        console.log(`🔄 Updating ${__filename}`);
        delete require.cache[fichier];
        require(fichier);
    });

    // ==================== START BOT ====================
    main();
}, 5000);
