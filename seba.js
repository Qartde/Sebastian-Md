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
const { verifierEtatJid, recupererActionJid } = require("./bdd/antilien");
const { atbverifierEtatJid, atbrecupererActionJid } = require("./bdd/antibot");
let evt = require(__dirname + "/framework/zokou");
const { isUserBanned, addUserToBanList, removeUserFromBanList } = require("./bdd/banUser");
const { addGroupToBanList, isGroupBanned, removeGroupFromBanList } = require("./bdd/banGroup");
const { isGroupOnlyAdmin, addGroupToOnlyAdminList, removeGroupFromOnlyAdminList } = require("./bdd/onlyAdmin");
let { reagir } = require(__dirname + "/framework/app");
const googleTTS = require('google-tts-api');
const ai = require('unlimited-ai');
const { exec } = require("child_process");

// ==================== GLOBAL VARIABLES ====================
var session = conf.session ? conf.session.replace(/Zokou-MD-WHATSAPP-BOT;;;=>/g, "") : "zokk";
const prefixe = conf.PREFIXE || ".";
const more = String.fromCharCode(8206);
const readmore = more.repeat(4001);

// Processing queue
const processingQueue = [];
let isProcessingQueue = false;

// Rate limiting
const rateLimit = new Map();
let lastReactionTime = 0;

// Message store for anti-delete
const messageStore = {};

// Group metadata cache
const groupMetadataCache = new Map();

// ==================== UTILITY FUNCTIONS ====================
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function isRateLimited(jid) {
    const now = Date.now();
    if (!rateLimit.has(jid)) {
        rateLimit.set(jid, now);
        return false;
    }
    const lastRequestTime = rateLimit.get(jid);
    if (now - lastRequestTime < 3000) {
        return true;
    }
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

async function processMessageQueue() {
    if (isProcessingQueue || processingQueue.length === 0) return;
    isProcessingQueue = true;
    
    while (processingQueue.length > 0) {
        const { from, message } = processingQueue.shift();
        await delay(100);
    }
    
    isProcessingQueue = false;
}

function getCurrentDateTime() {
    const options = {
        timeZone: 'Africa/Nairobi',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
    };
    return new Intl.DateTimeFormat('en-KE', options).format(new Date());
}

// Download audio function
const downloadAudio = (url, outputFile) => {
    return new Promise((resolve, reject) => {
        exec(`curl -s "${url}" -o ${outputFile}`, (error) => {
            if (error) reject(error);
            else resolve();
        });
    });
};

// Enhance audio function
const enhanceAudio = (inputFiles, outputFile) => {
    return new Promise((resolve, reject) => {
        const inputList = inputFiles.map(file => `-i ${file}`).join(' ');
        const filter = `"volume=1.4, bass=g=6, treble=g=5, equalizer=f=1000:t=q:w=1:g=3, afftdn"`;
        exec(`ffmpeg ${inputList} -filter_complex ${filter} -b:a 192k -y ${outputFile}`, (error) => {
            if (error) reject(error);
            else resolve();
        });
    });
};

// ==================== AUTHENTICATION ====================
async function authentification() {
    try {
        if (!fs.existsSync(__dirname + "/scan/creds.json")) {
            console.log("Connexion en cours...");
            await fs.writeFile(__dirname + "/scan/creds.json", Buffer.from(session, "base64").toString("utf-8"), "utf8");
        } else if (fs.existsSync(__dirname + "/scan/creds.json") && session != "zokk") {
            await fs.writeFile(__dirname + "/scan/creds.json", Buffer.from(session, "base64").toString("utf-8"), "utf8");
        }
    } catch (e) {
        console.log("Session Invalid: " + e);
        return;
    }
}
authentification();

// ==================== STORE SETUP ====================
const store = (0, baileys_1.makeInMemoryStore)({
    logger: pino().child({ level: "silent", stream: "store" }),
});

// ==================== MAIN FUNCTION ====================
setTimeout(() => {
    async function main() {
        const { version, isLatest } = await (0, baileys_1.fetchLatestBaileysVersion)();
        const { state, saveCreds } = await (0, baileys_1.useMultiFileAuthState)(__dirname + "/scan");
        
        const sockOptions = {
            version,
            logger: pino({ level: "silent" }),
            browser: ['SEBASTIAN-MD', "safari", "1.0.0"],
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
                    return msg?.message || undefined;
                }
                return { conversation: 'An Error Occurred, Repeat Command!' };
            }
        };
        
        const zk = (0, baileys_1.default)(sockOptions);
        store.bind(zk.ev);

        // ==================== ERROR HANDLING ====================
        process.on("uncaughtException", (err) => {});
        process.on("unhandledRejection", (err) => {});

        // ==================== MESSAGE HANDLER ====================
        zk.ev.on("messages.upsert", async (m) => {
            const { messages } = m;
            if (!messages || messages.length === 0) return;

            for (const ms of messages) {
                if (!ms.message) continue;
                
                const from = ms.key.remoteJid;
                if (isRateLimited(from)) continue;

                // Store messages for anti-delete
                if (conf.ANTIDELETE1 === "yes") {
                    if (!messageStore[from]) {
                        messageStore[from] = [];
                    }
                    messageStore[from].push(ms);
                    
                    // Keep only last 50 messages
                    if (messageStore[from].length > 50) {
                        messageStore[from] = messageStore[from].slice(-50);
                    }
                }

                // Process the message
                await handleMessage(zk, ms, from);
            }
        });

        // ==================== GROUP UPDATE HANDLER ====================
        zk.ev.on("groups.update", async (updates) => {
            for (const update of updates) {
                const { id } = update;
                if (!id.endsWith("@g.us")) continue;
                await getGroupMetadata(zk, id);
            }
        });

        // ==================== GROUP PARTICIPANTS UPDATE ====================
        const { recupevents } = require('./bdd/welcome');
        
        zk.ev.on('group-participants.update', async (group) => {
            console.log("Group update:", group);

            let ppgroup;
            try {
                ppgroup = await zk.profilePictureUrl(group.id, 'image');
            } catch {
                ppgroup = '';
            }

            try {
                const metadata = await zk.groupMetadata(group.id);

                if (group.action == 'add' && (await recupevents(group.id, "welcome") == 'on')) {
                    let msg = `*SEBASTIAN MD-BOT WELCOME MESSAGE*`;
                    let membres = group.participants;
                    for (let membre of membres) {
                        msg += ` \n❒ *Hey* 🖐️ @${membre.split("@")[0]} WELCOME TO OUR GROUP. \n\n`;
                    }
                    msg += `❒ *READ THE GROUP DESCRIPTION TO AVOID GETTING REMOVED* `;
                    
                    await zk.sendMessage(group.id, { 
                        image: { url: ppgroup || 'https://files.catbox.moe/aktbgo.jpg' }, 
                        caption: msg, 
                        mentions: membres 
                    });
                    
                } else if (group.action == 'remove' && (await recupevents(group.id, "goodbye") == 'on')) {
                    let msg = `One or more members left the group;\n`;
                    let membres = group.participants;
                    for (let membre of membres) {
                        msg += `@${membre.split("@")[0]}\n`;
                    }
                    await zk.sendMessage(group.id, { text: msg, mentions: membres });
                }
            } catch (e) {
                console.error("Group update error:", e);
            }
        });

        // ==================== CALL HANDLER ====================
        zk.ev.on("call", async (callData) => {
            if (conf.ANTICALL === 'yes' && callData.length > 0) {
                const callId = callData[0].id;
                const callerId = callData[0].from;

                await zk.rejectCall(callId, callerId);
                
                setTimeout(async () => {
                    await zk.sendMessage(callerId, {
                        text: `🚫 *Call Rejected!*\n\nHi there, I'm *SEBASTIAN MD* 🤖.\n⚠️ My owner is unavailable at the moment.\nPlease try again later or leave a message. Cheers! 😊`
                    });
                }, 1000);
            }
        });

        // ==================== CONTACTS HANDLER ====================
        zk.ev.on("contacts.upsert", async (contacts) => {
            for (const contact of contacts) {
                if (store.contacts[contact.id]) {
                    Object.assign(store.contacts[contact.id], contact);
                } else {
                    store.contacts[contact.id] = contact;
                }
            }
        });

        // ==================== CONNECTION HANDLER ====================
        zk.ev.on("connection.update", async (con) => {
            const { lastDisconnect, connection } = con;
            
            if (connection === "connecting") {
                console.log("ℹ️ SEBASTIAN-MD-BOT is connecting...");
            } else if (connection === 'open') {
                console.log("✅ SEBASTIAN-MD-BOT Connected to WhatsApp! ☺️");
                console.log("--");
                await delay(200);
                console.log("------");
                await delay(300);
                console.log("------------------/-----");
                console.log("SEBASTIAN-MD-BOT is Online 🕸\n\n");
                
                console.log("Loading SEBASTIAN-MD-BOT Commands ...\n");
                fs.readdirSync(__dirname + "/commandes").forEach((fichier) => {
                    if (path.extname(fichier).toLowerCase() == ".js") {
                        try {
                            require(__dirname + "/commandes/" + fichier);
                            console.log(fichier + " Installed Successfully✔️");
                        } catch (e) {
                            console.log(`${fichier} could not be installed: ${e.message}`);
                        }
                        delay(300);
                    }
                });
                
                await delay(700);
                
                var md = (conf.MODE || "").toLocaleLowerCase() === "yes" ? "public" : "private";
                console.log("Commands Installation Completed ✅");

                await activateCrons(zk);
                
                if ((conf.DP || "").toLowerCase() === 'yes') {
                    let cmsg = `
╭─────────────━┈⊷ 
│ *SEBASTIAN-MD-BOT IS CONNECTED*
╰─────────────━┈⊷
│ ᴘʀᴇғɪx: *[ ${prefixe} ]*
│ ᴍᴏᴅᴇ: *${md}*
╰─────────────━┈⊷ 
wchannel: https://whatsapp.com/channel/0029Vb7LxhRGE56l9woRjd2g        
                    `;
                    await zk.sendMessage(zk.user.id, { text: cmsg });
                }

                // Auto Bio Update
                setInterval(async () => {
                    if (conf.AUTO_BIO === "yes") {
                        const currentDateTime = getCurrentDateTime();
                        const bioText = `SEBASTIAN MD is online! 🚀 ${currentDateTime}`;
                        await zk.updateProfileStatus(bioText);
                    }
                }, 60000);
                
            } else if (connection == "close") {
                let raisonDeconnexion = new boom_1.Boom(lastDisconnect?.error)?.output.statusCode;
                if (raisonDeconnexion === baileys_1.DisconnectReason.badSession) {
                    console.log('Session id error, rescan again...');
                } else if (raisonDeconnexion === baileys_1.DisconnectReason.connectionClosed) {
                    console.log('!!! Connection closed, reconnecting...');
                    setTimeout(main, 5000);
                } else if (raisonDeconnexion === baileys_1.DisconnectReason.connectionLost) {
                    console.log('Connection error, trying to reconnect...');
                    setTimeout(main, 5000);
                } else if (raisonDeconnexion === baileys_1.DisconnectReason?.connectionReplaced) {
                    console.log('Connection replaced, another session is open!');
                } else if (raisonDeconnexion === baileys_1.DisconnectReason.loggedOut) {
                    console.log('Logged out, please rescan QR code!');
                } else if (raisonDeconnexion === baileys_1.DisconnectReason.restartRequired) {
                    console.log('Restart required...');
                    setTimeout(main, 5000);
                } else {
                    console.log('Restarting due to error:', raisonDeconnexion);
                    setTimeout(main, 5000);
                    return;
                }
            }
        });

        // ==================== CREDENTIALS UPDATE ====================
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
            let trueFileName = './' + (filename || Date.now().toString()) + '.' + (type?.ext || 'mp4');
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
                let interval;

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

    // ==================== CRON SETUP ====================
    async function activateCrons(zk) {
        try {
            const cron = require('node-cron');
            const { getCron } = require('./bdd/cron');

            let crons = await getCron();
            if (crons.length > 0) {
                for (let i = 0; i < crons.length; i++) {
                    if (crons[i].mute_at != null) {
                        let set = crons[i].mute_at.split(':');
                        cron.schedule(`${set[1]} ${set[0]} * * *`, async () => {
                            await zk.groupSettingUpdate(crons[i].group_id, 'announcement');
                            await zk.sendMessage(crons[i].group_id, { 
                                text: "Hello, it's time to close the group; sayonara." 
                            });
                        }, { timezone: "Africa/Nairobi" });
                    }

                    if (crons[i].unmute_at != null) {
                        let set = crons[i].unmute_at.split(':');
                        cron.schedule(`${set[1]} ${set[0]} * * *`, async () => {
                            await zk.groupSettingUpdate(crons[i].group_id, 'not_announcement');
                            await zk.sendMessage(crons[i].group_id, { 
                                text: "Good morning; It's time to open the group." 
                            });
                        }, { timezone: "Africa/Nairobi" });
                    }
                }
            }
        } catch (e) {
            console.log("Cron error:", e);
        }
    }

    // ==================== MESSAGE HANDLER FUNCTION ====================
    async function handleMessage(zk, ms, origineMessage) {
        try {
            const decodeJid = (jid) => {
                if (!jid) return jid;
                if (/:\d+@/gi.test(jid)) {
                    let decode = (0, baileys_1.jidDecode)(jid) || {};
                    return (decode.user && decode.server) ? decode.user + '@' + decode.server : jid;
                }
                return jid;
            };

            // Auto read
            if (conf.AUTO_READ === 'yes' && !ms.key.fromMe) {
                await zk.readMessages([ms.key]);
            }

            // Status updates
            if (ms.key && ms.key.remoteJid === "status@broadcast") {
                if (conf.AUTO_READ_STATUS === "yes") {
                    await zk.readMessages([ms.key]);
                }
                
                // Auto react to status
                if (conf.AUTO_REACT_STATUS === "yes") {
                    const now = Date.now();
                    if (now - lastReactionTime >= 5000) {
                        const botId = zk.user?.id ? zk.user.id.split(":")[0] + "@s.whatsapp.net" : null;
                        if (botId) {
                            try {
                                await zk.sendMessage(ms.key.remoteJid, {
                                    react: { key: ms.key, text: "💙" }
                                }, { statusJidList: [ms.key.participant, botId] });
                                lastReactionTime = now;
                            } catch (e) {}
                        }
                    }
                }
                
                // Auto download status
                if (conf.AUTO_DOWNLOAD_STATUS === "yes") {
                    const idBot = decodeJid(zk.user.id);
                    if (ms.message?.extendedTextMessage) {
                        await zk.sendMessage(idBot, { text: ms.message.extendedTextMessage.text }, { quoted: ms });
                    } else if (ms.message?.imageMessage) {
                        let stImg = await zk.downloadAndSaveMediaMessage(ms.message.imageMessage);
                        await zk.sendMessage(idBot, { 
                            image: { url: stImg }, 
                            caption: ms.message.imageMessage.caption || "" 
                        }, { quoted: ms });
                    } else if (ms.message?.videoMessage) {
                        let stVideo = await zk.downloadAndSaveMediaMessage(ms.message.videoMessage);
                        await zk.sendMessage(idBot, {
                            video: { url: stVideo },
                            caption: ms.message.videoMessage.caption || ""
                        }, { quoted: ms });
                    }
                }
            }

            // Anti-delete message
            if (conf.ANTIDELETE1 === "yes" && ms.message?.protocolMessage && ms.message.protocolMessage.type === 0) {
                const deletedKey = ms.message.protocolMessage.key;
                const remoteJid = deletedKey.remoteJid;
                
                const deletedMessage = messageStore[remoteJid]?.find(msg => msg.key.id === deletedKey.id);
                
                if (deletedMessage && !ms.key.fromMe) {
                    try {
                        const participant = deletedMessage.key.participant || deletedMessage.key.remoteJid;
                        const botOwnerJid = `${conf.NUMERO_OWNER || "254710772666"}@s.whatsapp.net`;
                        
                        if (deletedMessage.message?.conversation) {
                            await zk.sendMessage(botOwnerJid, {
                                text: `*🛑 Deleted message from @${participant.split("@")[0]}*\n\n${deletedMessage.message.conversation}`,
                                mentions: [participant]
                            });
                        } else if (deletedMessage.message?.imageMessage) {
                            let imgPath = await zk.downloadAndSaveMediaMessage(deletedMessage.message.imageMessage);
                            await zk.sendMessage(botOwnerJid, {
                                image: { url: imgPath },
                                caption: `*🛑 Deleted image from @${participant.split("@")[0]}*`,
                                mentions: [participant]
                            });
                        } else if (deletedMessage.message?.videoMessage) {
                            let vidPath = await zk.downloadAndSaveMediaMessage(deletedMessage.message.videoMessage);
                            await zk.sendMessage(botOwnerJid, {
                                video: { url: vidPath },
                                caption: `*🛑 Deleted video from @${participant.split("@")[0]}*`,
                                mentions: [participant]
                            });
                        }
                    } catch (e) {
                        console.log("Anti-delete error:", e);
                    }
                }
            }

            // Auto react to messages
            if (conf.AUTO_REACT === "yes" && !ms.key.fromMe) {
                const now = Date.now();
                if (now - lastReactionTime >= 5000) {
                    const conversationText = ms.message?.conversation || ms.message?.extendedTextMessage?.text || "";
                    const emoji = getEmojiForSentence(conversationText) || "👍";
                    
                    await zk.sendMessage(origineMessage, {
                        react: { text: emoji, key: ms.key }
                    }).catch(() => {});
                    
                    lastReactionTime = now;
                }
            }

            // Chatbot - only in private chat, not groups, not if command
            if (conf.CHATBOT === "yes" && !ms.key.fromMe && !verifCom && !verifGroupe) {
                const messageContent = ms.message?.conversation || ms.message?.extendedTextMessage?.text || "";
                if (messageContent.trim() && messageContent.length > 2) {
                    try {
                        const aiResponse = await ai.generate('gpt-4-turbo-2024-04-09', [
                            { role: 'system', content: 'You are SEBASTIAN MD bot. Respond briefly and helpfully.' },
                            { role: 'user', content: messageContent }
                        ]);
                        if (aiResponse) await zk.sendMessage(origineMessage, { text: aiResponse });
                    } catch (e) {
                        console.log("Chatbot error:", e.message);
                    }
                }
            }

            // Command handling
            var mtype = (0, baileys_1.getContentType)(ms.message);
            var texte = mtype === "conversation" ? ms.message.conversation :
                       mtype === "imageMessage" ? ms.message.imageMessage?.caption :
                       mtype === "videoMessage" ? ms.message.videoMessage?.caption :
                       mtype === "extendedTextMessage" ? ms.message?.extendedTextMessage?.text : "";

            if (!texte) return;

            var idBot = decodeJid(zk.user.id);
            const verifGroupe = origineMessage?.endsWith("@g.us");
            var infosGroupe = verifGroupe ? await getGroupMetadata(zk, origineMessage) : null;
            var nomGroupe = infosGroupe?.subject || "";
            var msgRepondu = ms.message.extendedTextMessage?.contextInfo?.quotedMessage;
            var auteurMsgRepondu = decodeJid(ms.message?.extendedTextMessage?.contextInfo?.participant);
            var auteurMessage = verifGroupe ? (ms.key.participant || ms.participant) : origineMessage;
            
            if (ms.key.fromMe) auteurMessage = idBot;

            const { getAllSudoNumbers } = require("./bdd/sudo");
            const sudo = await getAllSudoNumbers();
            const superUserNumbers = [idBot.split('@')[0], conf.NUMERO_OWNER].map(s => s.replace(/[^0-9]/g, '') + "@s.whatsapp.net");
            const allAllowedNumbers = [...superUserNumbers, ...sudo];
            const superUser = allAllowedNumbers.includes(auteurMessage);

            function repondre(mes) { zk.sendMessage(origineMessage, { text: mes }, { quoted: ms }); }

            // Group admin check
            let admins = [];
            if (verifGroupe && infosGroupe?.participants) {
                admins = infosGroupe.participants.filter(p => p.admin).map(p => p.id);
            }
            const verifAdmin = admins.includes(auteurMessage);
            const verifBotAdmin = admins.includes(idBot);

            const arg = texte.trim().split(/ +/).slice(1);
            const verifCom = texte.startsWith(prefixe);
            const com = verifCom ? texte.slice(1).trim().split(/ +/)[0].toLowerCase() : false;

            // Execute command
            if (verifCom && com) {
                const cd = evt.cm.find(cmd => cmd.nomCom === com);
                if (cd) {
                    try {
                        if (conf.MODE?.toLowerCase() !== 'yes' && !superUser) return;
                        if (!superUser && origineMessage === auteurMessage && conf.PM_PERMIT === "yes") {
                            repondre("You don't have access to commands here");
                            return;
                        }
                        
                        reagir(origineMessage, zk, ms, cd.reaction || "✅");
                        await cd.fonction(origineMessage, zk, {
                            superUser, verifGroupe, infosGroupe, nomGroupe, auteurMessage,
                            idBot, verifBotAdmin, prefixe, arg, repondre, mtype, msgRepondu,
                            auteurMsgRepondu, ms, mybotpic: () => {
                                const lien = (conf.URL || "").split(',') || ["https://files.catbox.moe/aktbgo.jpg"];
                                return lien[Math.floor(Math.random() * lien.length)];
                            }
                        });
                    } catch (e) {
                        console.log("Command error:", e);
                        zk.sendMessage(origineMessage, { text: "Error: " + e.message }, { quoted: ms });
                    }
                }
            }

        } catch (error) {
            console.log("Message handler error:", error);
        }
    }

    // ==================== EMOJI FUNCTIONS ====================
    const emojiMap = {
        "hello": ["👋", "😊", "🙂"], "hi": ["👋", "😀", "😁"], "bye": ["👋", "😢"],
        "thanks": ["🙏", "😊"], "thank you": ["🙏", "💐"], "love": ["❤️", "💕", "😍"],
        "happy": ["😊", "😁", "🎉"], "sad": ["😢", "😭"], "laugh": ["😂", "🤣"],
        "good": ["👍", "👌"], "cool": ["😎", "🔥"], "party": ["🥳", "🎉"],
        "welcome": ["😊", "🌹"], "congrats": ["🎉", "👏"], "sorry": ["😔", "🙏"],
        "help": ["🆘", "🙏"], "bot": ["🤖"], "sebastian": ["🤖", "👑"]
    };
    
    const fallbackEmojis = ["😎", "🔥", "👍", "👌", "💯", "✨", "🌟", "⚡", "🎉", "🎊"];

    function getEmojiForSentence(sentence) {
        const words = sentence.toLowerCase().split(/\s+/);
        for (const word of words) {
            if (emojiMap[word]) {
                return emojiMap[word][Math.floor(Math.random() * emojiMap[word].length)];
            }
        }
        return fallbackEmojis[Math.floor(Math.random() * fallbackEmojis.length)];
    }

    // ==================== START BOT ====================
    let fichier = require.resolve(__filename);
    fs.watchFile(fichier, () => {
        fs.unwatchFile(fichier);
        console.log(`🔄 Updating ${__filename}`);
        delete require.cache[fichier];
        require(fichier);
    });
    
    main();
}, 5000);
