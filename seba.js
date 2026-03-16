function hi() {
  console.log("Hello World!");
}
hi();
"use strict";
var __createBinding = this && this.__createBinding || (Object.create ? function (_0x3eaa66, _0x2405e3, _0x1552c8, _0x4e6a28) {
  if (_0x4e6a28 === undefined) {
    _0x4e6a28 = _0x1552c8;
  }
  var _0x36d67f = Object.getOwnPropertyDescriptor(_0x2405e3, _0x1552c8);
  if (!_0x36d67f || ("get" in _0x36d67f ? !_0x2405e3.__esModule : _0x36d67f.writable || _0x36d67f.configurable)) {
    _0x36d67f = {
      'enumerable': true,
      'get': function () {
        return _0x2405e3[_0x1552c8];
      }
    };
  }
  Object.defineProperty(_0x3eaa66, _0x4e6a28, _0x36d67f);
} : function (_0x41491f, _0x5ee808, _0x1fec9e, _0x580afb) {
  if (_0x580afb === undefined) {
    _0x580afb = _0x1fec9e;
  }
  _0x41491f[_0x580afb] = _0x5ee808[_0x1fec9e];
});
var __setModuleDefault = this && this.__setModuleDefault || (Object.create ? function (_0x130d7e, _0x120265) {
  Object.defineProperty(_0x130d7e, 'default', {
    'enumerable': true,
    'value': _0x120265
  });
} : function (_0x308830, _0x1900c3) {
  _0x308830['default'] = _0x1900c3;
});
var __importStar = this && this.__importStar || function (_0x7cfcd9) {
  if (_0x7cfcd9 && _0x7cfcd9.__esModule) {
    return _0x7cfcd9;
  }
  var _0x55e669 = {};
  if (_0x7cfcd9 != null) {
    for (var _0x3cd052 in _0x7cfcd9) if (_0x3cd052 !== "default" && Object.prototype.hasOwnProperty.call(_0x7cfcd9, _0x3cd052)) {
      __createBinding(_0x55e669, _0x7cfcd9, _0x3cd052);
    }
  }
  __setModuleDefault(_0x55e669, _0x7cfcd9);
  return _0x55e669;
};
var __importDefault = this && this.__importDefault || function (_0x11368c) {
  return _0x11368c && _0x11368c.__esModule ? _0x11368c : {
    'default': _0x11368c
  };
};
Object.defineProperty(exports, "__esModule", {
  'value': true
});
const baileys_1 = __importStar(require("@whiskeysockets/baileys"));
const logger_1 = __importDefault(require("@whiskeysockets/baileys/lib/Utils/logger"));
const logger = logger_1['default'].child({});
logger.level = "silent";
const pino = require("pino");
const boom_1 = require("@hapi/boom");
const conf = require('./set');
let fs = require("fs-extra");
let path = require("path");
const FileType = require('file-type');
const {
  Sticker,
  createSticker,
  StickerTypes
} = require("wa-sticker-formatter");
const {
  verifierEtatJid,
  recupererActionJid
} = require('./bdd/antilien');
const {
  atbverifierEtatJid,
  atbrecupererActionJid
} = require("./bdd/antibot");
let evt = require(__dirname + "/framework/zokou");
const {
  isUserBanned,
  addUserToBanList,
  removeUserFromBanList
} = require('./bdd/banUser');
const {
  addGroupToBanList,
  isGroupBanned,
  removeGroupFromBanList
} = require('./bdd/banGroup');
const {
  isGroupOnlyAdmin,
  addGroupToOnlyAdminList,
  removeGroupFromOnlyAdminList
} = require("./bdd/onlyAdmin");
let {
  reagir
} = require(__dirname + "/framework/app");
var session = conf.session.replace(/Zokou-MD-WHATSAPP-BOT;;;=>/g, '');
const prefixe = conf.PREFIXE;
async function authentification() {
  try {
    if (!fs.existsSync(__dirname + "/scan/creds.json")) {
      console.log("connexion en cour ...");
      await fs.writeFileSync(__dirname + "/scan/creds.json", atob(session), "utf8");
    } else if (fs.existsSync(__dirname + "/scan/creds.json") && session != "zokk") {
      await fs.writeFileSync(__dirname + "/scan/creds.json", atob(session), "utf8");
    }
  } catch (_0x3eb81a) {
    console.log("Session Invalid " + _0x3eb81a);
    return;
  }
}
authentification();
0x0;
const store = baileys_1.makeInMemoryStore({
  'logger': pino().child({
    'level': 'silent',
    'stream': "store"
  })
});
setTimeout(() => {
  async function _0x568e34() {
    0x0;
    const {
      version: _0x3bbd4b,
      isLatest: _0x433c9c
    } = await baileys_1.fetchLatestBaileysVersion();
    0x0;
    const {
      state: _0x333085,
      saveCreds: _0x356ea6
    } = await baileys_1.useMultiFileAuthState(__dirname + '/scan');
    0x0;
    const _0x2d9aab = {
      'version': _0x3bbd4b,
      'logger': pino({
        'level': "silent"
      }),
      'browser': ["Bmw-Md", 'safari', "1.0.0"],
      'printQRInTerminal': true,
      'fireInitQueries': false,
      'shouldSyncHistoryMessage': true,
      'downloadHistory': true,
      'syncFullHistory': true,
      'generateHighQualityLinkPreview': true,
      'markOnlineOnConnect': false,
      'keepAliveIntervalMs': 0x7530,
      'auth': {
        'creds': _0x333085.creds,
        'keys': baileys_1.makeCacheableSignalKeyStore(_0x333085.keys, logger)
      },
      'getMessage': async _0x1698a0 => {
        if (store) {
          const _0x3c8958 = await store.loadMessage(_0x1698a0.remoteJid, _0x1698a0.id, undefined);
          return _0x3c8958.message || undefined;
        }
        return {
          'conversation': "An Error Occurred, Repeat Command!"
        };
      }
    };
    0x0;
    const _0x3d26aa = baileys_1['default'](_0x2d9aab);
    store.bind(_0x3d26aa.ev);
    const _0x2ac395 = new Map();
    function _0x5a2957(_0x183540) {
      const _0x5d80af = Date.now();
      if (!_0x2ac395.has(_0x183540)) {
        _0x2ac395.set(_0x183540, _0x5d80af);
        return false;
      }
      const _0x5900e7 = _0x2ac395.get(_0x183540);
      if (_0x5d80af - _0x5900e7 < 0xbb8) {
        return true;
      }
      _0x2ac395.set(_0x183540, _0x5d80af);
      return false;
    }
    const _0x344dc1 = new Map();
    async function _0xf13e04(_0x2980de, _0x5e5d09) {
      if (_0x344dc1.has(_0x5e5d09)) {
        return _0x344dc1.get(_0x5e5d09);
      }
      try {
        const _0x42670e = await _0x2980de.groupMetadata(_0x5e5d09);
        _0x344dc1.set(_0x5e5d09, _0x42670e);
        setTimeout(() => _0x344dc1["delete"](_0x5e5d09), 0xea60);
        return _0x42670e;
      } catch (_0x4dcf80) {
        if (_0x4dcf80.message.includes("rate-overlimit")) {
          await new Promise(_0x338758 => setTimeout(_0x338758, 0x1388));
        }
        return null;
      }
    }
    process.on('uncaughtException', _0x256241 => {});
    process.on("unhandledRejection", _0x5906aa => {});
    _0x3d26aa.ev.on("messages.upsert", async _0x3e5b0b => {
      const {
        messages: _0x33c412
      } = _0x3e5b0b;
      if (!_0x33c412 || _0x33c412.length === 0x0) {
        return;
      }
      for (const _0x196a97 of _0x33c412) {
        if (!_0x196a97.message) {
          continue;
        }
        const _0x341594 = _0x196a97.key.remoteJid;
        if (_0x5a2957(_0x341594)) {
          continue;
        }
      }
    });
    _0x3d26aa.ev.on("groups.update", async _0x127ab0 => {
      for (const _0x5a5af1 of _0x127ab0) {
        const {
          id: _0x115cd6
        } = _0x5a5af1;
        if (!_0x115cd6.endsWith("@g.us")) {
          continue;
        }
        await _0xf13e04(_0x3d26aa, _0x115cd6);
      }
    });
    _0x3d26aa.ev.on("messages.upsert", async _0x14dd11 => {
      const {
        messages: _0xd0b8c0
      } = _0x14dd11;
      if (!_0xd0b8c0 || _0xd0b8c0.length === 0x0) {
        return;
      }
      for (const _0x19bec1 of _0xd0b8c0) {
        if (!_0x19bec1.message) {
          continue;
        }
        const _0x2b3a03 = _0x19bec1.key.remoteJid;
        if (_0x5a2957(_0x2b3a03)) {
          continue;
        }
        processingQueue.push({
          'from': _0x2b3a03,
          'message': _0x19bec1.message
        });
        if (!isProcessingQueue) {
          processMessageQueue();
        }
      }
    });
    _0x3d26aa.ev.on("groups.update", async _0x5d99d1 => {
      for (const _0x12bf03 of _0x5d99d1) {
        const {
          id: _0x3400d6
        } = _0x12bf03;
        if (!_0x3400d6.endsWith('@g.us')) {
          continue;
        }
        console.log("🔄 Group update detected: " + _0x3400d6);
        const _0x299852 = await _0xf13e04(_0x3d26aa, _0x3400d6);
        if (_0x299852) {
          console.log("📜 Updated group info:", _0x299852.subject);
        }
      }
    });
    _0x3d26aa.ev.on("messages.upsert", async _0x2933be => {
      if (conf.ANTIDELETE1 === "yes") {
        const {
          messages: _0x33585a
        } = _0x2933be;
        const _0x3745ca = _0x33585a[0x0];
        if (!_0x3745ca.message) {
          return;
        }
        const _0x3d7647 = _0x3745ca.key;
        const _0x129ad6 = _0x3d7647.remoteJid;
        if (!store.chats[_0x129ad6]) {
          store.chats[_0x129ad6] = [];
        }
        store.chats[_0x129ad6].push(_0x3745ca);
        if (_0x3745ca.message.protocolMessage && _0x3745ca.message.protocolMessage.type === 0x0) {
          const _0xf1f64 = _0x3745ca.message.protocolMessage.key;
          const _0xb20487 = store.chats[_0x129ad6];
          const _0x47a38f = _0xb20487.find(_0x14d441 => _0x14d441.key.id === _0xf1f64.id);
          if (_0x47a38f) {
            try {
              const _0x47eb63 = _0x47a38f.key.participant || _0x47a38f.key.remoteJid;
              const _0x3d825f = "*🛑 This message was deleted by @" + _0x47eb63.split('@')[0x0] + '*';
              const _0x22aee4 = conf.NUMERO_OWNER + "@s.whatsapp.net";
              if (_0x47a38f.message.conversation) {
                await _0x3d26aa.sendMessage(_0x22aee4, {
                  'text': _0x3d825f + "\nDeleted message: " + _0x47a38f.message.conversation,
                  'mentions': [_0x47eb63]
                });
              } else {
                if (_0x47a38f.message.imageMessage) {
                  const _0x43ba47 = _0x47a38f.message.imageMessage.caption || '';
                  const _0x860072 = await _0x3d26aa.downloadAndSaveMediaMessage(_0x47a38f.message.imageMessage);
                  await _0x3d26aa.sendMessage(_0x22aee4, {
                    'image': {
                      'url': _0x860072
                    },
                    'caption': _0x3d825f + "\n" + _0x43ba47,
                    'mentions': [_0x47eb63]
                  });
                } else {
                  if (_0x47a38f.message.videoMessage) {
                    const _0x4cda8e = _0x47a38f.message.videoMessage.caption || '';
                    const _0x50e32f = await _0x3d26aa.downloadAndSaveMediaMessage(_0x47a38f.message.videoMessage);
                    await _0x3d26aa.sendMessage(_0x22aee4, {
                      'video': {
                        'url': _0x50e32f
                      },
                      'caption': _0x3d825f + "\n" + _0x4cda8e,
                      'mentions': [_0x47eb63]
                    });
                  } else {
                    if (_0x47a38f.message.audioMessage) {
                      const _0x2bb78f = await _0x3d26aa.downloadAndSaveMediaMessage(_0x47a38f.message.audioMessage);
                      await _0x3d26aa.sendMessage(_0x22aee4, {
                        'audio': {
                          'url': _0x2bb78f
                        },
                        'ptt': true,
                        'caption': _0x3d825f,
                        'mentions': [_0x47eb63]
                      });
                    } else {
                      if (_0x47a38f.message.stickerMessage) {
                        const _0x14565e = await _0x3d26aa.downloadAndSaveMediaMessage(_0x47a38f.message.stickerMessage);
                        await _0x3d26aa.sendMessage(_0x22aee4, {
                          'sticker': {
                            'url': _0x14565e
                          },
                          'caption': _0x3d825f,
                          'mentions': [_0x47eb63]
                        });
                      }
                    }
                  }
                }
              }
            } catch (_0x4ee92b) {
              console.error("Error handling deleted message:", _0x4ee92b);
            }
          }
        }
      }
    });
    const _0x36433b = _0x4002bc => new Promise(_0x951fc9 => setTimeout(_0x951fc9, _0x4002bc));
    let _0x2f1f8b = 0x0;
    if (conf.AUTO_REACT_STATUS === "yes") {
      console.log("AUTO_REACT_STATUS is enabled. Listening for status updates...");
      _0x3d26aa.ev.on("messages.upsert", async _0x5dec79 => {
        const {
          messages: _0x6d1996
        } = _0x5dec79;
        for (const _0x3cba52 of _0x6d1996) {
          if (_0x3cba52.key && _0x3cba52.key.remoteJid === "status@broadcast") {
            console.log("Detected status update from:", _0x3cba52.key.remoteJid);
            const _0x1e992f = Date.now();
            if (_0x1e992f - _0x2f1f8b < 0x1388) {
              console.log("Throttling reactions to prevent overflow.");
              continue;
            }
            const _0x287af6 = _0x3d26aa.user && _0x3d26aa.user.id ? _0x3d26aa.user.id.split(':')[0x0] + "@s.whatsapp.net" : null;
            if (!_0x287af6) {
              console.log("Bot's user ID not available. Skipping reaction.");
              continue;
            }
            await _0x3d26aa.sendMessage(_0x3cba52.key.remoteJid, {
              'react': {
                'key': _0x3cba52.key,
                'text': '🌍'
              }
            }, {
              'statusJidList': [_0x3cba52.key.participant, _0x287af6]
            });
            _0x2f1f8b = Date.now();
            console.log("Successfully reacted to status update by " + _0x3cba52.key.remoteJid);
            await _0x36433b(0x7d0);
          }
        }
      });
    }
    const _0x2c1147 = require("google-tts-api");
    const _0x21039e = require("unlimited-ai");
    _0x3d26aa.ev.on('messages.upsert', async _0x42574e => {
      const {
        messages: _0x53e215
      } = _0x42574e;
      const _0x18b429 = _0x53e215[0x0];
      if (!_0x18b429.message) {
        return;
      }
      const _0x494c8a = Object.keys(_0x18b429.message)[0x0];
      const _0x20ca95 = _0x18b429.key.remoteJid;
      const _0x39ed36 = _0x18b429.message.conversation || _0x18b429.message.extendedTextMessage?.["text"];
      if (_0x18b429.key.fromMe || _0x20ca95 === conf.NUMERO_OWNER + "@s.whatsapp.net") {
        return;
      }
      if (conf.CHATBOT1 !== "yes") {
        return;
      }
      if (_0x494c8a === "conversation" || _0x494c8a === "extendedTextMessage") {
        const _0x347c67 = _0x39ed36.trim();
        if (!_0x347c67) {
          return;
        }
        let _0x18dc54 = [];
        try {
          const _0x58096b = fs.readFileSync('store.json', "utf8");
          if (_0x58096b) {
            _0x18dc54 = JSON.parse(_0x58096b);
            if (!Array.isArray(_0x18dc54)) {
              _0x18dc54 = [];
            }
          }
        } catch (_0x572459) {
          console.log("No previous conversation found, starting new one.");
        }
        const _0x51a330 = {
          'role': "user",
          'content': _0x347c67
        };
        const _0x4eeef2 = {
          'role': "system",
          'content': " You respond to user commands. Only mention developer name if someone asks."
        };
        _0x18dc54.push(_0x51a330);
        _0x18dc54.push(_0x4eeef2);
        try {
          const _0x3e1019 = await _0x21039e.generate("gpt-4-turbo-2024-04-09", _0x18dc54);
          _0x18dc54.push({
            'role': "assistant",
            'content': _0x3e1019
          });
          fs.writeFileSync("store.json", JSON.stringify(_0x18dc54, null, 0x2));
          const _0x1015ca = /[^\x00-\x7F]/.test(_0x3e1019) ? 'sw' : 'en';
          const _0x3c6de2 = _0x1015ca === 'sw' ? 'sw-TZ-Wavenet-B' : "en-US-Wavenet-F";
          const _0x2dc5fb = (_0xe17dba, _0x58f5aa = 0xc8) => {
            const _0x1ceb87 = _0xe17dba.split(" ");
            let _0x40d457 = [];
            let _0x409e3b = '';
            _0x1ceb87.forEach(_0x52b0e3 => {
              if ((_0x409e3b + _0x52b0e3).length > _0x58f5aa) {
                _0x40d457.push(_0x409e3b.trim());
                _0x409e3b = '';
              }
              _0x409e3b += " " + _0x52b0e3;
            });
            if (_0x409e3b) {
              _0x40d457.push(_0x409e3b.trim());
            }
            return _0x40d457;
          };
          const _0x12e124 = _0x2dc5fb(_0x3e1019);
          let _0x5442c6 = [];
          for (let _0x25cea2 = 0x0; _0x25cea2 < _0x12e124.length; _0x25cea2++) {
            const _0x5d1be1 = _0x2c1147.getAudioUrl(_0x12e124[_0x25cea2], {
              'lang': _0x1015ca,
              'slow': false,
              'host': "https://translate.google.com",
              'voice': _0x3c6de2
            });
            const _0x1bed2c = "audio_" + _0x25cea2 + '.mp3';
            await _0x3deeb1(_0x5d1be1, _0x1bed2c);
            _0x5442c6.push(_0x1bed2c);
          }
          if (_0x5442c6.length === 0x0) {
            console.error("No audio files generated.");
            return;
          }
          await _0x54bfb7(_0x5442c6, "enhanced_audio.mp3");
          if (!fs.existsSync("enhanced_audio.mp3")) {
            console.error("Enhanced audio file not found.");
            return;
          }
          await _0x3d26aa.sendMessage(_0x20ca95, {
            'audio': {
              'url': "enhanced_audio.mp3"
            },
            'mimetype': "audio/mp4",
            'ptt': true
          });
          _0x5442c6.forEach(_0x144f57 => fs.unlinkSync(_0x144f57));
          fs.unlinkSync("enhanced_audio.mp3");
        } catch (_0x4ce81c) {
          console.error("Error with AI generation:", _0x4ce81c);
        }
      }
    });
    const _0x3deeb1 = (_0x2be078, _0x4e3f91) => {
      return new Promise((_0xbf6047, _0xd63d58) => {
        exec("curl -s \"" + _0x2be078 + "\" -o " + _0x4e3f91, _0x2a1f22 => {
          if (_0x2a1f22) {
            _0xd63d58(_0x2a1f22);
          } else {
            _0xbf6047();
          }
        });
      });
    };
    const _0x54bfb7 = (_0xb48402, _0x5f5ee7) => {
      return new Promise((_0xac9db, _0x83d6ad) => {
        const _0x264f7f = _0xb48402.map(_0x65a35f => "-i " + _0x65a35f).join(" ");
        exec("ffmpeg " + _0x264f7f + " -filter_complex " + "\"volume=1.4, bass=g=6, treble=g=5, equalizer=f=1000:t=q:w=1:g=3, afftdn\"" + " -b:a 192k -y " + _0x5f5ee7, _0x2fdc64 => {
          if (_0x2fdc64) {
            _0x83d6ad(_0x2fdc64);
          } else {
            _0xac9db();
          }
        });
      });
    };
    _0x3d26aa.ev.on('messages.upsert', async _0x5654f4 => {
      const {
        messages: _0x5f4818
      } = _0x5654f4;
      const _0x301178 = _0x5f4818[0x0];
      if (!_0x301178.message) {
        return;
      }
      const _0x50e392 = Object.keys(_0x301178.message)[0x0];
      const _0x330713 = _0x301178.key.remoteJid;
      const _0x143150 = _0x301178.message.conversation || _0x301178.message.extendedTextMessage?.["text"];
      if (_0x301178.key.fromMe || _0x330713 === conf.NUMERO_OWNER + '@s.whatsapp.net') {
        return;
      }
      if (conf.CHATBOT !== "yes") {
        return;
      }
      if (_0x50e392 === "conversation" || _0x50e392 === "extendedTextMessage") {
        const _0x636878 = _0x143150.trim();
        if (!_0x636878) {
          return;
        }
        let _0x1073b8 = [];
        try {
          const _0x23574f = fs.readFileSync("store.json", "utf8");
          if (_0x23574f) {
            _0x1073b8 = JSON.parse(_0x23574f);
            if (!Array.isArray(_0x1073b8)) {
              _0x1073b8 = [];
            }
          }
        } catch (_0x1c536d) {
          console.log("No previous conversation found, starting new one.");
        }
        const _0x155f6b = {
          'role': 'user',
          'content': _0x636878
        };
        const _0x4d581e = {
          'role': "system",
          'content': " You respond to user commands. Only mention developer name if someone asks."
        };
        _0x1073b8.push(_0x155f6b);
        _0x1073b8.push(_0x4d581e);
        try {
          const _0x4fc88d = await _0x21039e.generate("gpt-4-turbo-2024-04-09", _0x1073b8);
          _0x1073b8.push({
            'role': "assistant",
            'content': _0x4fc88d
          });
          fs.writeFileSync('store.json', JSON.stringify(_0x1073b8, null, 0x2));
          await _0x3d26aa.sendMessage(_0x330713, {
            'text': _0x4fc88d
          });
        } catch (_0x1232ed) {
          console.error("Error with AI generation:", _0x1232ed);
        }
      }
    });
    const _0x4a84a6 = {
      'hello': ['👋', '🙂', '😊', '🙋‍♂️', '🙋‍♀️'],
      'hi': ['👋', '🙂', '😁', "🙋‍♂️", "🙋‍♀️"],
      "good morning": ['🌅', '🌞', '☀️', '🌻', '🌼'],
      "good night": ['🌙', '🌜', '⭐', '🌛', '💫'],
      'bye': ['👋', '😢', "👋🏻", '🥲', "🚶‍♂️", "🚶‍♀️"],
      "see you": ['👋', '😊', "👋🏻", '✌️', "🚶‍♂️"],
      'bro': ["🤜🤛", '👊', '💥', '🥊', '👑'],
      'sister': ['👭', "💁‍♀️", '🌸', '💖', "🙋‍♀️"],
      'buddy': ['🤗', "👯‍♂️", "👯‍♀️", "🤜🤛", '🤝'],
      'niaje': ['👋', '😄', '💥', '🔥', '🕺', '💃'],
      'enb': ['😎', '💯', '🔥', '🚀', '👑'],
      'enbxmd': ['🔥', '💥', '👑', '💯', '😎'],
      'thanks': ['🙏', '😊', '💖', '❤️', '💐'],
      "thank you": ['🙏', '😊', '🙌', '💖', '💝'],
      'love': ['❤️', '💖', '💘', '😍', '😘', '💍', '💑'],
      "miss you": ['😢', '💔', '😔', '😭', '💖'],
      'sorry': ['😔', '🙏', '😓', '💔', '🥺'],
      'apologies': ['😔', '💔', '🙏', '😞', '🙇‍♂️', "🙇‍♀️"],
      'congratulations': ['🎉', '🎊', '🏆', '🎁', '👏'],
      "well done": ['👏', '💪', '🎉', "🎖️", '👍'],
      "good job": ['👏', '💯', '👍', '🌟', '🎉'],
      'happy': ['😁', '😊', '🎉', '🎊', '💃', '🕺'],
      'sad': ['😢', '😭', '😞', '💔', '😓'],
      'angry': ['😡', '🤬', '😤', '💢', '😾'],
      'excited': ['🤩', '🎉', '😆', '🤗', '🥳'],
      'surprised': ['😲', '😳', '😯', '😮', '😲'],
      'help': ['🆘', '❓', '🙏', '💡', "👨‍💻", "👩‍💻"],
      'how': ['❓', '🤔', '😕', '😳', '🧐'],
      'what': ['❓', "🤷‍♂️", '🤷‍♀️', '😕', '😲'],
      'where': ['❓', '🌍', "🗺️", "🏙️", '🌎'],
      'party': ['🎉', '🥳', '🍾', '🍻', '🎤', '💃', '🕺'],
      'fun': ['🤣', '😂', '🥳', '🎉', '🎮', '🎲'],
      'hangout': ['🍕', '🍔', '🍻', '🎮', '🍿', '😆'],
      'good': ['👍', '👌', '😊', '💯', '🌟'],
      'awesome': ['🔥', '🚀', '🤩', '👏', '💥'],
      'cool': ['😎', '👌', '🎮', '🎸', '💥'],
      'boring': ['😴', '🥱', '🙄', '😑', '🤐'],
      'tired': ['😴', '🥱', '😌', '💤', '🛌'],
      'bot': ['🤖', '💻', '⚙️', '🧠', '🔧'],
      'robot': ['🤖', '⚙️', '💻', '🔋', '🤓'],
      "cool bot": ['🤖', '😎', '🤘', '💥', '🎮'],
      "love you": ['❤️', '💖', '😘', '💋', '💑'],
      "thank you bot": ['🙏', '🤖', '😊', '💖', '💐'],
      "good night bot": ['🌙', '🌛', '⭐', '💤', '😴'],
      'laughter': ['😂', '🤣', '😆', '😄', '🤪'],
      'crying': ['😢', '😭', '😿', '😓', '💔'],
      'john': ['👑', '🔥', '💥', '😎', '💯'],
      'mike': ['💪', '🏆', '🔥', '💥', '🚀'],
      'lisa': ['💖', '👑', '🌸', '😍', '🌺'],
      'emily': ['💖', '💃', '👑', '🎉', '🎀'],
      'happy': ['😁', '😄', '😊', '🙌', '🎉', '🥳', '💃', '🕺', '🔥'],
      'excited': ['🤩', '🎉', '🥳', '🎊', '😆', '🤗', '💥', '🚀'],
      'love': ['❤️', '💖', '💘', '💝', '😍', '😘', '💍', '💑', '🌹'],
      'grateful': ['🙏', '💐', '🥰', '❤️', '😊'],
      'thankful': ['🙏', '💖', '💐', '🤗', '😇'],
      'sad': ['😢', '😭', '😞', '💔', '😔', '😓', '😖'],
      'angry': ['😡', '😠', '🤬', '💢', '👊', '💥', '⚡'],
      'frustrated': ['😤', '😩', '🤯', '😑', '🌀'],
      'bored': ['😴', '🥱', '🙄', '😑', '😒'],
      'surprised': ['😲', '😳', '😮', '😯', '😲', '🙀'],
      'shocked': ['😱', '😳', '😯', '💥', '🤯'],
      'wow': ['😲', '😱', '🤩', '🤯', '💥', '🚀'],
      'crying': ['😭', '😢', '💔', '😞', '😓'],
      "miss you": ['😭', '💔', '😔', '😢', '❤️'],
      'lonely': ['😔', '😭', '😢', '💔', '🙁'],
      'help': ['🆘', '❓', '🤔', "🙋‍♂️", '🙋‍♀️', '💡'],
      "need assistance": ['🆘', "💁‍♂️", "💁‍♀️", '❓', '🙏'],
      'sorry': ['😔', '🙏', '💔', '😓', '🥺', "🙇‍♂️", "🙇‍♀️"],
      'apology': ['😔', '😞', '🙏', '💔', "🙇‍♂️", "🙇‍♀️"],
      "good job": ['👏', '💯', '🎉', '🌟', '👍', '👏'],
      "well done": ['👏', '🎉', "🎖️", '💪', '🔥', '🏆'],
      "you can do it": ['💪', '🔥', '💯', '🚀', '🌟'],
      'congratulations': ['🎉', '🏆', '🎊', '🎁', '👏', '🍾'],
      'cheers': ['🥂', '🍻', '🍾', '🍷', '🥳', '🎉'],
      'goodbye': ['👋', '😢', '💔', "👋🏻", "🚶‍♂️", "🚶‍♀️"],
      'bye': ['👋', "👋🏻", '🥲', "🚶‍♂️", "🚶‍♀️"],
      "see you": ['👋', "👋🏻", '🤗', '✌️', "🙋‍♂️", '🙋‍♀️'],
      'hello': ['👋', '🙂', '😊', '🙋‍♂️', "🙋‍♀️"],
      'hi': ['👋', '🙂', '😁', "🙋‍♂️", "🙋‍♀️"],
      'party': ['🎉', '🥳', '🎤', '💃', '🕺', '🍻', '🎶'],
      'fun': ['🎮', '🎲', '🤣', '🎉', '🃏'],
      'play': ['🎮', '🏀', '⚽', '🎾', '🎱', '🎲', '🏆'],
      'work': ['💻', "🖥️", '💼', '📅', '📝'],
      'school': ['📚', '🏫', '🎒', "👨‍🏫", "👩‍🏫"],
      'study': ['📖', '📝', '💡', '📚', '🎓'],
      'summer': ['🌞', "🏖️", '🌴', '🍉', '🌻'],
      'winter': ['❄️', '☃️', '🎿', '🔥', '⛄'],
      'autumn': ['🍁', '🍂', '🎃', '🍂', '🍁'],
      'spring': ['🌸', '🌼', '🌷', '🌱', '🌺'],
      'birthday': ['🎂', '🎉', '🎁', '🎈', '🎊'],
      'anniversary': ['💍', '🎉', '🎁', '🎈', '💑'],
      'robot': ['🤖', '⚙️', '🔧', '🤖', '🧠'],
      'bot': ['🤖', '🧠', '⚙️', '💻', '🖥️'],
      'thanks': ['🙏', '💖', '😊', '❤️', '💐'],
      "good luck": ['🍀', '🍀', '💯', '🍀', '🎯'],
      'john': ['👑', '🔥', '💥', '😎', '💯'],
      'mike': ['💪', '🏆', '🔥', '💥', '🚀'],
      'lisa': ['💖', '👑', '🌸', '😍', '🌺'],
      'emily': ['💖', '💃', '👑', '🎉', '🎀'],
      'food': ['🍕', '🍔', '🍟', '🍲', '🍣', '🍩'],
      'drink': ['🍺', '🍷', '🥂', '🍾', '🥤'],
      'coffee': ['☕', '🥤', '🍵', '🥶'],
      'tea': ['🍵', '🫖', '🍂', '🍃'],
      'excited': ['🤩', '🎉', '🥳', '💥', '🚀', '😆', '😜'],
      'nervous': ['😬', '😰', '🤞', '🧠', '👐'],
      'confused': ['🤔', '😕', '🧐', '😵', "🤷‍♂️", "🤷‍♀️"],
      'embarrassed': ['😳', '😳', '🙈', '😳', '😬', '😅'],
      'hopeful': ['🤞', '🌠', '🙏', '🌈', '💫'],
      'shy': ['😊', '😳', '🙈', '🫣', '🫶'],
      'family': ["👨‍👩‍👧‍👦", "👩‍👧", "👩‍👧‍👦", "👨‍👩‍👧", '💏', "👨‍👨‍👧‍👦", "👩‍👩‍👧‍👦"],
      'friends': ["👯‍♂️", "👯‍♀️", '🤗', '🫶', '💫', '🤝'],
      'relationship': ['💑', '❤️', '💍', '🥰', '💏', '💌'],
      'couple': ["👩‍❤️‍👨", "👨‍❤️‍👨", '👩‍❤️‍👩', '💍', '💑', '💏'],
      "best friend": ['🤗', '💖', "👯‍♀️", "👯‍♂️", '🙌'],
      "love you": ['❤️', '😘', '💖', '💘', '💓', '💗'],
      'vacation': ['🏖️', '🌴', '✈️', '🌊', '🛳️', "🏞️", "🏕️"],
      'beach': ["🏖️", '🌊', '🏄‍♀️', '🩴', "🏖️", '🌴', '🦀'],
      "road trip": ['🚗', '🚙', "🛣️", '🌄', '🌟'],
      'mountain': ["🏞️", '⛰️', "🏔️", '🌄', "🏕️", '🌲'],
      'city': ["🏙️", '🌆', '🗽', '🌇', '🚖', "🏙️"],
      'exploration': ['🌍', '🧭', '🌎', '🌍', '🧳', '📍', '⛵'],
      'morning': ['🌅', '☀️', '🌞', '🌄', '🌻', "🕶️"],
      'afternoon': ['🌞', '🌤️', '⛅', '🌻', '🌇'],
      'night': ['🌙', '🌛', '🌜', '⭐', '🌚', '💫'],
      'evening': ['🌙', '🌛', '🌇', '🌓', '💫'],
      'goodnight': ['🌙', '😴', '💤', '🌜', '🛌', '🌛', '✨'],
      'productivity': ['💻', '📊', '📝', '💼', '📅', '📈'],
      'office': ["🖥️", '💼', '🗂️', '📅', "🖋️"],
      'workout': ["🏋️‍♀️", '💪', "🏃‍♂️", "🏃‍♀️", '🤸‍♀️', "🚴‍♀️", "🏋️‍♂️"],
      "study hard": ['📚', '📝', '📖', '💡', '💼'],
      'focus': ['🔍', '🎯', '💻', '🧠', '🤓'],
      'food': ['🍕', '🍔', '🍟', '🍖', '🍖', '🥗', '🍣', '🍲'],
      'drink': ['🍹', '🥤', '🍷', '🍾', '🍸', '🍺', '🥂', '☕'],
      'coffee': ['☕', '🧃', '🍵', '🥤', '🍫'],
      'cake': ['🍰', '🎂', '🍩', '🍪', '🍫', '🧁'],
      "ice cream": ['🍦', '🍧', '🍨', '🍪'],
      'cat': ['🐱', '😺', '🐈', '🐾'],
      'dog': ['🐶', '🐕', '🐩', '🐕‍🦺', '🐾'],
      'bird': ['🐦', '🦉', '🦅', '🐦'],
      'fish': ['🐟', '🐠', '🐡', '🐡', '🐙'],
      'rabbit': ['🐰', '🐇', '🐹', '🐾'],
      'lion': ['🦁', '🐯', '🐅', '🐆'],
      'bear': ['🐻', '🐨', '🐼', "🐻‍❄️"],
      'elephant': ['🐘', '🐘'],
      'sun': ['☀️', '🌞', '🌄', '🌅', '🌞'],
      'rain': ["🌧️", '☔', '🌈', '🌦️', "🌧️"],
      'snow': ['❄️', '⛄', "🌨️", "🌬️", '❄️'],
      'wind': ['💨', "🌬️", "🌪️", "🌬️"],
      'earth': ['🌍', '🌏', '🌎', '🌍', '🌱', '🌳'],
      'phone': ['📱', '☎️', '📞', '📲', '📡'],
      'computer': ['💻', '🖥️', '⌨️', "🖱️", "🖥️"],
      'internet': ['🌐', '💻', '📶', '📡', '🔌'],
      'software': ['💻', "🖥️", "🧑‍💻", "🖱️", '💡'],
      'star': ['⭐', '🌟', '✨', '🌠', '💫'],
      'light': ['💡', '🔦', '✨', '🌟', '🔆'],
      'money': ['💵', '💰', '💸', '💳', '💶'],
      'victory': ['✌️', '🏆', '🎉', "🎖️", '🎊'],
      'gift': ['🎁', '🎀', '🎉', '🎁'],
      'fire': ['🔥', '💥', '🌋', '🔥', '💣'],
      'music': ['🎵', '🎶', '🎧', '🎤', '🎸', '🎹'],
      'sports': ['⚽', '🏀', '🏈', '🎾', "🏋️‍♂️", "🏃‍♀️", '🏆', '🥇'],
      'games': ['🎮', '🕹️', '🎲', '🎯', '🧩'],
      'art': ['🎨', '🖌️', "🖼️", '🎭', '🖍️'],
      'photography': ['📷', '📸', '📸', "🖼️", '🎥'],
      'reading': ['📚', '📖', '📚', '📰'],
      'craft': ['🧵', '🪡', '✂️', '🪢', '🧶'],
      'hello': ['👋', '🙂', '😊'],
      'hey': ['👋', '🙂', '😊'],
      'hi': ['👋', '🙂', '😊'],
      'bye': ['👋', '😢', '👋'],
      'goodbye': ['👋', '😢', "🙋‍♂️"],
      'thanks': ['🙏', '😊', '🌹'],
      "thank you": ['🙏', '😊', '🌸'],
      'welcome': ['😊', '😄', '🌷'],
      'congrats': ['🎉', '👏', '🥳'],
      'congratulations': ['🎉', '👏', '🥳'],
      "good job": ['👏', '👍', '🙌'],
      'great': ['👍', '💪', '😄'],
      'cool': ['😎', '🤙', '🔥'],
      'ok': ['👌', '👍', '✅'],
      'love': ['❤️', '💕', '💖'],
      'like': ['👍', '❤️', '👌'],
      'happy': ['😊', '😁', '🙂'],
      'joy': ['😁', '😆', '😂'],
      'laugh': ['😂', '🤣', '😁'],
      'sad': ['😢', '😭', '☹️'],
      'cry': ['😭', '😢', '😿'],
      'angry': ['😡', '😠', '💢'],
      'mad': ['😠', '😡', '😤'],
      'shocked': ['😲', '😱', '😮'],
      'scared': ['😱', '😨', '😧'],
      'sleep': ['😴', '💤', '😌'],
      'bored': ['😐', '😑', '🙄'],
      'excited': ['🤩', '🥳', '🎉'],
      'party': ['🥳', '🎉', '🍾'],
      'kiss': ['😘', '💋', '😍'],
      'hug': ['🤗', '❤️', '💕'],
      'peace': ['✌️', "🕊️", '✌️'],
      'pizza': ['🍕', '🥖', '🍟'],
      'coffee': ['☕', '🥤', '🍵'],
      'water': ['💧', '💦', '🌊'],
      'wine': ['🍷', '🍸', '🍾'],
      'hello': ['👋', '🙂', '😊', '😃', '😄'],
      'hey': ['👋', '😊', '🙋', '😄', '😁'],
      'hi': ['👋', '😀', '😁', '😃', '🙂'],
      'bye': ['👋', '😢', "🙋‍♂️", '😞', '😔'],
      'goodbye': ['👋', '😢', "🙋‍♀️", '😔', '😭'],
      'thanks': ['🙏', '😊', '🌹', '🤲', '🤗'],
      "thank you": ['🙏', '💐', '🤲', '🥰', '😌'],
      'welcome': ['😊', '😄', '🌸', '🙂', '💖'],
      'congrats': ['🎉', '👏', '🥳', '💐', '🎊'],
      'congratulations': ['🎉', '👏', '🥳', '🎊', '🍾'],
      "good job": ['👏', '👍', '🙌', '💪', '🤩'],
      'great': ['👍', '💪', '😄', '🔥', '✨'],
      'cool': ['😎', '🤙', '🔥', '👌', '🆒'],
      'ok': ['👌', '👍', '✅', '😌', '🤞'],
      'love': ['❤️', '💕', '💖', '💗', '😍'],
      'like': ['👍', '❤️', '👌', '😌', '💓'],
      'happy': ['😊', '😁', '🙂', '😃', '😄'],
      'joy': ['😁', '😆', '😂', '😊', '🤗'],
      'laugh': ['😂', '🤣', '😁', '😹', '😄'],
      'sad': ['😢', '😭', '☹️', '😞', '😔'],
      'cry': ['😭', '😢', '😿', '💧', '😩'],
      'angry': ['😡', '😠', '💢', '😤', '🤬'],
      'mad': ['😠', '😡', '😤', '💢', '😒'],
      'shocked': ['😲', '😱', '😮', '😯', '😧'],
      'scared': ['😱', '😨', '😧', '😰', '😳'],
      'sleep': ['😴', '💤', '😌', '😪', '🛌'],
      'bored': ['😐', '😑', '🙄', '😒', '🤦'],
      'excited': ['🤩', '🥳', '🎉', '😄', '✨'],
      'party': ['🥳', '🎉', '🎊', '🍾', '🎈'],
      'kiss': ['😘', '💋', '😍', '💖', '💏'],
      'hug': ['🤗', '❤️', '💕', '💞', '😊'],
      'peace': ['✌️', "🕊️", '🤞', '💫', '☮️'],
      'pizza': ['🍕', '🥖', '🍟', '🍔', '🍝'],
      'burger': ['🍔', '🍟', '🥓', '🥪', '🌭'],
      'fries': ['🍟', '🍔', '🥤', '🍿', '🧂'],
      'coffee': ['☕', '🥤', '🍵', '🫖', '🥄'],
      'tea': ['🍵', '☕', '🫖', '🥄', '🍪'],
      'cake': ['🍰', '🎂', '🧁', '🍩', '🍫'],
      'donut': ['🍩', '🍪', '🍰', '🧁', '🍫'],
      "ice cream": ['🍦', '🍨', '🍧', '🍧', '🍫'],
      'cookie': ['🍪', '🍩', '🍰', '🧁', '🍫'],
      'chocolate': ['🍫', '🍬', '🍰', '🍦', '🍭'],
      'popcorn': ['🍿', '🥤', '🍫', '🎬', '🍩'],
      'soda': ['🥤', '🍾', '🍹', '🍷', '🍸'],
      'water': ['💧', '💦', '🌊', '🚰', '🥤'],
      'wine': ['🍷', '🍾', '🥂', '🍹', '🍸'],
      'beer': ['🍺', '🍻', '🥂', '🍹', '🍾'],
      'cheers': ['🥂', '🍻', '🍾', '🎉', '🎊'],
      'sun': ['🌞', '☀️', '🌅', '🌄', '🌻'],
      'moon': ['🌜', '🌙', '🌚', '🌝', '🌛'],
      'star': ['🌟', '⭐', '✨', '💫', '🌠'],
      'cloud': ['☁️', "🌥️", "🌤️", '⛅', '🌧️'],
      'rain': ['🌧️', '☔', '💧', '💦', '🌂'],
      'thunder': ['⚡', '⛈️', '🌩️', "🌪️", '⚠️'],
      'fire': ['🔥', '⚡', '🌋', '🔥', '💥'],
      'flower': ['🌸', '🌺', '🌷', '💐', '🌹'],
      'tree': ['🌳', '🌲', '🌴', '🎄', '🌱'],
      'leaves': ['🍃', '🍂', '🍁', '🌿', '🌾'],
      'snow': ['❄️', '⛄', "🌨️", "🌬️", '☃️'],
      'wind': ['💨', "🌬️", '🍃', '⛅', "🌪️"],
      'rainbow': ['🌈', "🌤️", '☀️', '✨', '💧'],
      'ocean': ['🌊', '💦', '🚤', '⛵', '🏄‍♂️'],
      'dog': ['🐶', '🐕', '🐾', '🐩', '🦮'],
      'cat': ['🐱', '😺', '😸', '🐾', '🦁'],
      'lion': ['🦁', '🐯', '🐱', '🐾', '🐅'],
      'tiger': ['🐯', '🐅', '🦁', '🐆', '🐾'],
      'bear': ['🐻', '🐨', '🐼', '🧸', '🐾'],
      'rabbit': ['🐰', '🐇', '🐾', '🐹', '🐭'],
      'panda': ['🐼', '🐻', '🐾', '🐨', '🍃'],
      'monkey': ['🐒', '🐵', '🙊', '🙉', '🙈'],
      'fox': ['🦊', '🐺', '🐾', '🐶', '🦮'],
      'bird': ['🐦', '🐧', '🦅', '🦢', '🦜'],
      'fish': ['🐟', '🐠', '🐡', '🐬', '🐳'],
      'whale': ['🐋', '🐳', '🌊', '🐟', '🐠'],
      'dolphin': ['🐬', '🐟', '🐠', '🐳', '🌊'],
      'unicorn': ['🦄', '✨', '🌈', '🌸', '💫'],
      'bee': ['🐝', '🍯', '🌻', '💐', '🐞'],
      'butterfly': ['🦋', '🌸', '💐', '🌷', '🌼'],
      'phoenix': ['🦅', '🔥', '✨', '🌄', '🔥'],
      'wolf': ['🐺', '🌕', '🐾', '🌲', '🌌'],
      'mouse': ['🐭', '🐁', '🧀', '🐾', '🐀'],
      'cow': ['🐮', '🐄', '🐂', '🌾', '🍀'],
      'pig': ['🐷', '🐽', '🐖', '🐾', '🐗'],
      'horse': ['🐴', '🏇', '🐎', '🌄', "🏞️"],
      'sheep': ['🐑', '🐏', '🌾', '🐾', '🐐'],
      'soccer': ['⚽', '🥅', "🏟️", '🎉', '👏'],
      'basketball': ['🏀', "⛹️‍♂️", '🏆', '🎉', '🥇'],
      'tennis': ['🎾', '🏸', '🥇', '🏅', '💪'],
      'baseball': ['⚾', "🏟️", '🏆', '🎉', '👏'],
      'football': ['🏈', '🎉', "🏟️", '🏆', '🥅'],
      'golf': ['⛳', '🏌️‍♂️', "🏌️‍♀️", '🎉', '🏆'],
      'bowling': ['🎳', '🏅', '🎉', '🏆', '👏'],
      'running': ['🏃‍♂️', "🏃‍♀️", '👟', '🏅', '🔥'],
      'swimming': ["🏊‍♂️", "🏊‍♀️", '🌊', '🏆', '👏'],
      'cycling': ["🚴‍♂️", "🚴‍♀️", '🏅', '🔥', "🏞️"],
      'yoga': ['🧘', '🌸', '💪', '✨', '😌'],
      'dancing': ['💃', '🕺', '🎶', '🥳', '🎉'],
      'singing': ['🎤', '🎶', "🎙️", '🎉', '🎵'],
      'guitar': ['🎸', '🎶', '🎼', '🎵', '🎉'],
      'piano': ['🎹', '🎶', '🎼', '🎵', '🎉'],
      'money': ['💸', '💰', '💵', '💳', '🤑'],
      'fire': ['🔥', '💥', '⚡', '🎇', '✨'],
      'rocket': ['🚀', '🌌', '🛸', "🛰️", '✨'],
      'bomb': ['💣', '🔥', '⚡', '😱', '💥'],
      'computer': ['💻', "🖥️", '📱', '⌨️', "🖱️"],
      'phone': ['📱', '📲', '☎️', '📞', '📳'],
      'camera': ['📷', '📸', '🎥', '📹', '🎞️'],
      'book': ['📚', '📖', '✏️', '📘', '📕'],
      'light': ['💡', '✨', '🔦', '🌟', '🌞'],
      'music': ['🎶', '🎵', '🎼', '🎸', '🎧'],
      'star': ['🌟', '⭐', '✨', '🌠', '💫'],
      'gift': ['🎁', '💝', '🎉', '🎊', '🎈'],
      'car': ['🚗', '🚘', '🚙', '🚕', '🛣️'],
      'train': ['🚆', '🚄', '🚅', '🚞', '🚂'],
      'plane': ['✈️', '🛫', '🛬', "🛩️", '🚁'],
      'boat': ['⛵', "🛥️", '🚤', '🚢', '🌊'],
      'city': ["🏙️", '🌆', '🌇', '🏢', '🌃'],
      'beach': ['🏖️', '🌴', '🌊', '☀️', "🏄‍♂️"],
      'mountain': ["🏔️", '⛰️', '🗻', '🌄', '🌞'],
      'forest': ['🌲', '🌳', '🍃', '🏞️', '🐾'],
      'desert': ['🏜️', '🌵', '🐪', '🌞', "🏖️"],
      'hotel': ['🏨', '🏩', "🛏️", "🛎️", '🏢'],
      'restaurant': ["🍽️", '🍴', '🥂', '🍷', '🍾'],
      'brave': ["🦸‍♂️", "🦸‍♀️", '💪', '🔥', '👊'],
      'shy': ['😳', '☺️', '🙈', '😊', '😌'],
      'surprised': ['😲', '😮', '😧', '😯', '🤯'],
      'bored': ['😐', '😑', '😶', '🙄', '😒'],
      'sleepy': ['😴', '💤', '😪', '😌', '🛌'],
      'determined': ['💪', '🔥', '😤', '👊', '🏆'],
      'birthday': ['🎂', '🎉', '🎈', '🎊', '🍰'],
      'christmas': ['🎄', '🎅', '🤶', '🎁', '⛄'],
      "new year": ['🎉', '🎊', '🎇', '🍾', '✨'],
      'easter': ['🐰', '🐣', '🌷', '🥚', '🌸'],
      'halloween': ['🎃', '👻', "🕸️", "🕷️", '👹'],
      'valentine': ['💘', '❤️', '💌', '💕', '🌹'],
      'wedding': ['💍', '👰', '🤵', '🎩', '💒']
    };
    const _0x50df32 = ['😎', '🔥', '💥', '💯', '✨', '🌟', '🌈', '⚡', '💎', '🌀', '👑', '🎉', '🎊', '🦄', '👽', '🛸', '🚀', '🦋', '💫', '🍀', '🎶', '🎧', '🎸', '🎤', '🏆', '🏅', '🌍', '🌎', '🌏', '🎮', '🎲', '💪', '🏋️', '🥇', '👟', '🏃', '🚴', '🚶', '🏄', '⛷️', "🕶️", '🧳', '🍿', '🍿', '🥂', '🍻', '🍷', '🍸', '🥃', '🍾', '🎯', '⏳', '🎁', '🎈', '🎨', '🌻', '🌸', '🌺', '🌹', '🌼', '🌞', '🌝', '🌜', '🌙', '🌚', '🍀', '🌱', '🍃', '🍂', '🌾', '🐉', '🐍', '🦓', '🦄', '🦋', '🦧', '🦘', '🦨', '🦡', '🐉', '🐅', '🐆', '🐓', '🐢', '🐊', '🐠', '🐟', '🐡', '🦑', '🐙', '🦀', '🐬', '🦕', '🦖', '🐾', '🐕', '🐈', '🐇', '🐾', '🐁', '🐀', '🐿️'];
    const _0x573361 = _0x2f5d9e => {
      const _0x496136 = _0x2f5d9e.split(/\s+/);
      for (const _0x198003 of _0x496136) {
        const _0x25c2e3 = _0x519420(_0x198003.toLowerCase());
        if (_0x25c2e3) {
          return _0x25c2e3;
        }
      }
      return _0x50df32[Math.floor(Math.random() * _0x50df32.length)];
    };
    const _0x519420 = _0x1df75a => {
      const _0x44e898 = _0x4a84a6[_0x1df75a.toLowerCase()];
      if (_0x44e898 && _0x44e898.length > 0x0) {
        return _0x44e898[Math.floor(Math.random() * _0x44e898.length)];
      }
      return null;
    };
    if (conf.AUTO_REACT === "yes") {
      console.log("AUTO_REACT is enabled. Listening for regular messages...");
      _0x3d26aa.ev.on('messages.upsert', async _0x1afce5 => {
        const {
          messages: _0x3ccb3d
        } = _0x1afce5;
        for (const _0x419595 of _0x3ccb3d) {
          if (_0x419595.key && _0x419595.key.remoteJid) {
            const _0x3065f1 = Date.now();
            if (_0x3065f1 - _0x2f1f8b < 0x1388) {
              console.log("Throttling reactions to prevent overflow.");
              continue;
            }
            const _0x7a23d4 = _0x419595?.["message"]?.["conversation"] || '';
            const _0x5df8b9 = _0x573361(_0x7a23d4) || _0x50df32[Math.floor(Math.random() * _0x50df32.length)];
            if (_0x5df8b9) {
              await _0x3d26aa.sendMessage(_0x419595.key.remoteJid, {
                'react': {
                  'text': _0x5df8b9,
                  'key': _0x419595.key
                }
              }).then(() => {
                _0x2f1f8b = Date.now();
                console.log("Successfully reacted with '" + _0x5df8b9 + "' to message by " + _0x419595.key.remoteJid);
              })["catch"](_0x56c301 => {
                console.error("Failed to send reaction:", _0x56c301);
              });
            }
            await _0x36433b(0x7d0);
          }
        }
      });
    }
    function _0x399546() {
      const _0x308a31 = {
        'timeZone': "Africa/Nairobi",
        'year': "numeric",
        'month': "2-digit",
        'day': "2-digit",
        'hour': "2-digit",
        'minute': "2-digit",
        'second': "2-digit",
        'hour12': false
      };
      const _0x110f5f = new Intl.DateTimeFormat("en-KE", _0x308a31).format(new Date());
      return _0x110f5f;
    }
    setInterval(async () => {
      if (conf.AUTO_BIO === "yes") {
        const _0x3f15aa = _0x399546();
        const _0x4ccada = "SEBASTIAN MD is online! 🎉\n" + _0x3f15aa;
        await _0x3d26aa.updateProfileStatus(_0x4ccada);
        console.log("Updated Bio: " + _0x4ccada);
      }
    }, 0xea60);
    _0x3d26aa.ev.on("call", async _0x5ebc6c => {
      if (conf.ANTICALL === "yes") {
        const _0x50dc4e = _0x5ebc6c[0x0].id;
        const _0x3342b6 = _0x5ebc6c[0x0].from;
        await _0x3d26aa.rejectCall(_0x50dc4e, _0x3342b6);
        setTimeout(async () => {
          await _0x3d26aa.sendMessage(_0x3342b6, {
            'text': "🚫 *Call Rejected!*  \nHi there, I’m *SEBASTIAN MD* 🎗.  \n⚠️ My owner is unavailable at the moment.  \nPlease try again later or leave a message. Cheers! 🙃"
          });
        }, 0x3e8);
      }
    });
    _0x3d26aa.ev.on("messages.upsert", async _0x3d7b87 => {
      const {
        messages: _0x382e75
      } = _0x3d7b87;
      const _0xb150fc = _0x382e75[0x0];
      if (!_0xb150fc.message) {
        return;
      }
      const _0x1d7d1e = _0xb150fc.message.conversation || _0xb150fc.message.extendedTextMessage?.["text"] || '';
      const _0x39acc7 = _0xb150fc.key.remoteJid;
      if (_0x1d7d1e.slice(0x1).toLowerCase() === "vcf") {
        if (!_0x39acc7.endsWith('@g.us')) {
          await _0x3d26aa.sendMessage(_0x39acc7, {
            'text': "❌ This command only works in groups.\n\n🎉 SEBASTIAN MD BOT"
          });
          return;
        }
        await createAndSendGroupVCard(_0x39acc7, "SEBASTIAN MD BOT", _0x3d26aa);
      }
    });
    _0x3d26aa.ev.on("messages.upsert", async _0x43e294 => {
      const {
        messages: _0x1713fd
      } = _0x43e294;
      const _0x4255fa = _0x1713fd[0x0];
      if (!_0x4255fa.message) {
        return;
      }
      const _0x5394a8 = _0x5b5a7a => {
        if (!_0x5b5a7a) {
          return _0x5b5a7a;
        }
        if (/:\d+@/gi.test(_0x5b5a7a)) {
          0x0;
          let _0x155022 = baileys_1.jidDecode(_0x5b5a7a) || {};
          return _0x155022.user && _0x155022.server && _0x155022.user + '@' + _0x155022.server || _0x5b5a7a;
        } else {
          return _0x5b5a7a;
        }
      };
      0x0;
      var _0x16ac52 = baileys_1.getContentType(_0x4255fa.message);
      var _0x60b140 = _0x16ac52 == 'conversation' ? _0x4255fa.message.conversation : _0x16ac52 == 'imageMessage' ? _0x4255fa.message.imageMessage?.["caption"] : _0x16ac52 == "videoMessage" ? _0x4255fa.message.videoMessage?.['caption'] : _0x16ac52 == "extendedTextMessage" ? _0x4255fa.message?.["extendedTextMessage"]?.["text"] : _0x16ac52 == "buttonsResponseMessage" ? _0x4255fa?.["message"]?.['buttonsResponseMessage']?.["selectedButtonId"] : _0x16ac52 == "listResponseMessage" ? _0x4255fa.message?.["listResponseMessage"]?.["singleSelectReply"]?.["selectedRowId"] : _0x16ac52 == "messageContextInfo" ? _0x4255fa?.["message"]?.['buttonsResponseMessage']?.["selectedButtonId"] || _0x4255fa.message?.["listResponseMessage"]?.['singleSelectReply']?.["selectedRowId"] || _0x4255fa.text : '';
      var _0x590a2e = _0x4255fa.key.remoteJid;
      var _0x288042 = _0x5394a8(_0x3d26aa.user.id);
      var _0x404619 = _0x288042.split('@')[0x0];
      const _0x909aea = _0x590a2e?.['endsWith']('@g.us');
      var _0x44fe28 = _0x909aea ? await _0x3d26aa.groupMetadata(_0x590a2e) : '';
      var _0x41e965 = _0x909aea ? _0x44fe28.subject : '';
      var _0x48d338 = _0x4255fa.message.extendedTextMessage?.['contextInfo']?.['quotedMessage'];
      var _0x3df8a8 = _0x5394a8(_0x4255fa.message?.["extendedTextMessage"]?.["contextInfo"]?.["participant"]);
      var _0x1237bb = _0x909aea ? _0x4255fa.key.participant ? _0x4255fa.key.participant : _0x4255fa.participant : _0x590a2e;
      if (_0x4255fa.key.fromMe) {
        _0x1237bb = _0x288042;
      }
      var _0x564c5f = _0x909aea ? _0x4255fa.key.participant : '';
      const {
        getAllSudoNumbers: _0x62ed8d
      } = require("./bdd/sudo");
      const _0x8dd932 = _0x4255fa.pushName;
      const _0x531187 = await _0x62ed8d();
      const _0x5bd710 = [_0x404619, "255693629079", "255693629079", "255693629079", "255693629079", conf.NUMERO_OWNER].map(_0x4beba5 => _0x4beba5.replace(/[^0-9]/g) + "@s.whatsapp.net");
      const _0x8e955a = _0x5bd710.concat(_0x531187);
      const _0x2020e6 = _0x8e955a.includes(_0x1237bb);
      var _0x3afd52 = ["255693629079", "255693629079", "255693629079", "255693629079"].map(_0x1d713a => _0x1d713a.replace(/[^0-9]/g) + '@s.whatsapp.net').includes(_0x1237bb);
      function _0x4f4caf(_0x27cd17) {
        _0x3d26aa.sendMessage(_0x590a2e, {
          'text': _0x27cd17
        }, {
          'quoted': _0x4255fa
        });
      }
      console.log("\t🌍SEBASTIAN MD-BOT ONLINE🌍");
      console.log("=========== written message===========");
      if (_0x909aea) {
        console.log("message provenant du groupe : " + _0x41e965);
      }
      console.log("message envoyé par : [" + _0x8dd932 + " : " + _0x1237bb.split("@s.whatsapp.net")[0x0] + " ]");
      console.log("type de message : " + _0x16ac52);
      console.log("------ contenu du message ------");
      console.log(_0x60b140);
      function _0x459a50(_0x285244) {
        let _0x1d531b = [];
        for (_0x43e294 of _0x285244) {
          if (_0x43e294.admin == null) {
            continue;
          }
          _0x1d531b.push(_0x43e294.id);
        }
        return _0x1d531b;
      }
      var _0x3d2f5e = conf.ETAT;
      if (_0x3d2f5e == 0x1) {
        await _0x3d26aa.sendPresenceUpdate("available", _0x590a2e);
      } else {
        if (_0x3d2f5e == 0x2) {
          await _0x3d26aa.sendPresenceUpdate("composing", _0x590a2e);
        } else if (_0x3d2f5e == 0x3) {
          await _0x3d26aa.sendPresenceUpdate("recording", _0x590a2e);
        } else {
          await _0x3d26aa.sendPresenceUpdate("unavailable", _0x590a2e);
        }
      }
      const _0x36f187 = _0x909aea ? await _0x44fe28.participants : '';
      let _0x51f7a1 = _0x909aea ? _0x459a50(_0x36f187) : '';
      const _0x2dfb52 = _0x909aea ? _0x51f7a1.includes(_0x1237bb) : false;
      var _0x4da2fe = _0x909aea ? _0x51f7a1.includes(_0x288042) : false;
      const _0x1b69df = _0x60b140 ? _0x60b140.trim().split(/ +/).slice(0x1) : null;
      const _0x2eb5b3 = _0x60b140 ? _0x60b140.startsWith(prefixe) : false;
      const _0x2cc9e5 = _0x2eb5b3 ? _0x60b140.slice(0x1).trim().split(/ +/).shift().toLowerCase() : false;
      const _0x156d9d = conf.URL.split(',');
      function _0x27325b() {
        const _0x57809c = Math.floor(Math.random() * _0x156d9d.length);
        const _0x20fdf5 = _0x156d9d[_0x57809c];
        return _0x20fdf5;
      }
      var _0x3af7c1 = {
        'superUser': _0x2020e6,
        'dev': _0x3afd52,
        'verifGroupe': _0x909aea,
        'mbre': _0x36f187,
        'membreGroupe': _0x564c5f,
        'verifAdmin': _0x2dfb52,
        'infosGroupe': _0x44fe28,
        'nomGroupe': _0x41e965,
        'auteurMessage': _0x1237bb,
        'nomAuteurMessage': _0x8dd932,
        'idBot': _0x288042,
        'verifZokouAdmin': _0x4da2fe,
        'prefixe': prefixe,
        'arg': _0x1b69df,
        'repondre': _0x4f4caf,
        'mtype': _0x16ac52,
        'groupeAdmin': _0x459a50,
        'msgRepondu': _0x48d338,
        'auteurMsgRepondu': _0x3df8a8,
        'ms': _0x4255fa,
        'mybotpic': _0x27325b
      };
      if (conf.AUTO_READ === "yes") {
        _0x3d26aa.ev.on("messages.upsert", async _0x7b59ec => {
          const {
            messages: _0x587d4e
          } = _0x7b59ec;
          for (const _0x5316cd of _0x587d4e) {
            if (!_0x5316cd.key.fromMe) {
              await _0x3d26aa.readMessages([_0x5316cd.key]);
            }
          }
        });
      }
      if (_0x4255fa.key && _0x4255fa.key.remoteJid === 'status@broadcast' && conf.AUTO_READ_STATUS === "yes") {
        await _0x3d26aa.readMessages([_0x4255fa.key]);
      }
      if (_0x4255fa.key && _0x4255fa.key.remoteJid === 'status@broadcast' && conf.AUTO_DOWNLOAD_STATUS === "yes") {
        if (_0x4255fa.message.extendedTextMessage) {
          var _0x390167 = _0x4255fa.message.extendedTextMessage.text;
          await _0x3d26aa.sendMessage(_0x288042, {
            'text': _0x390167
          }, {
            'quoted': _0x4255fa
          });
        } else {
          if (_0x4255fa.message.imageMessage) {
            var _0x182a31 = _0x4255fa.message.imageMessage.caption;
            var _0x5dc077 = await _0x3d26aa.downloadAndSaveMediaMessage(_0x4255fa.message.imageMessage);
            await _0x3d26aa.sendMessage(_0x288042, {
              'image': {
                'url': _0x5dc077
              },
              'caption': _0x182a31
            }, {
              'quoted': _0x4255fa
            });
          } else {
            if (_0x4255fa.message.videoMessage) {
              var _0x182a31 = _0x4255fa.message.videoMessage.caption;
              var _0x105ccd = await _0x3d26aa.downloadAndSaveMediaMessage(_0x4255fa.message.videoMessage);
              await _0x3d26aa.sendMessage(_0x288042, {
                'video': {
                  'url': _0x105ccd
                },
                'caption': _0x182a31
              }, {
                'quoted': _0x4255fa
              });
            }
          }
        }
      }
      if (!_0x3afd52 && _0x590a2e == "120363158701337904@g.us") {
        return;
      }
      if (_0x60b140 && _0x1237bb.endsWith("s.whatsapp.net")) {
        const {
          ajouterOuMettreAJourUserData: _0x5dbc2f
        } = require('./bdd/level');
        try {
          await _0x5dbc2f(_0x1237bb);
        } catch (_0x5beb1f) {
          console.error(_0x5beb1f);
        }
      }
      try {
        if (_0x4255fa.message[_0x16ac52].contextInfo.mentionedJid && (_0x4255fa.message[_0x16ac52].contextInfo.mentionedJid.includes(_0x288042) || _0x4255fa.message[_0x16ac52].contextInfo.mentionedJid.includes(conf.NUMERO_OWNER + "@s.whatsapp.net"))) {
          if (_0x590a2e == '120363158701337904@g.us') {
            return;
          }
          ;
          if (_0x2020e6) {
            console.log("hummm");
            return;
          }
          let _0x35c60e = require("./bdd/mention");
          let _0x2cf0df = await _0x35c60e.recupererToutesLesValeurs();
          let _0x32dd79 = _0x2cf0df[0x0];
          if (_0x32dd79.status === 'non') {
            console.log("mention pas actifs");
            return;
          }
          let _0x5472b8;
          if (_0x32dd79.type.toLocaleLowerCase() === "image") {
            _0x5472b8 = {
              'image': {
                'url': _0x32dd79.url
              },
              'caption': _0x32dd79.message
            };
          } else {
            if (_0x32dd79.type.toLocaleLowerCase() === "video") {
              _0x5472b8 = {
                'video': {
                  'url': _0x32dd79.url
                },
                'caption': _0x32dd79.message
              };
            } else {
              if (_0x32dd79.type.toLocaleLowerCase() === 'sticker') {
                let _0x5b3a2b = new Sticker(_0x32dd79.url, {
                  'pack': conf.NOM_OWNER,
                  'type': StickerTypes.FULL,
                  'categories': ['🤩', '🎉'],
                  'id': "12345",
                  'quality': 0x46,
                  'background': "transparent"
                });
                const _0x270a0c = await _0x5b3a2b.toBuffer();
                _0x5472b8 = {
                  'sticker': _0x270a0c
                };
              } else if (_0x32dd79.type.toLocaleLowerCase() === "audio") {
                _0x5472b8 = {
                  'audio': {
                    'url': _0x32dd79.url
                  },
                  'mimetype': "audio/mp4"
                };
              }
            }
          }
          _0x3d26aa.sendMessage(_0x590a2e, _0x5472b8, {
            'quoted': _0x4255fa
          });
        }
      } catch (_0xe5088a) {}
      try {
        const _0x3f65f2 = await verifierEtatJid(_0x590a2e);
        if (_0x60b140.includes("https://") && _0x909aea && _0x3f65f2) {
          console.log("lien detecté");
          var _0x25aeb3 = _0x909aea ? _0x51f7a1.includes(_0x288042) : false;
          if (_0x2020e6 || _0x2dfb52 || !_0x25aeb3) {
            console.log("je fais rien");
            return;
          }
          ;
          const _0x373901 = {
            'remoteJid': _0x590a2e,
            'fromMe': false,
            'id': _0x4255fa.key.id,
            'participant': _0x1237bb
          };
          var _0x2b9ec8 = "lien detected, \n";
          var _0x317755 = new Sticker("https://raw.githubusercontent.com/djalega8000/Zokou-MD/main/media/remover.gif", {
            'pack': "Zoou-Md",
            'author': conf.OWNER_NAME,
            'type': StickerTypes.FULL,
            'categories': ['🤩', '🎉'],
            'id': '12345',
            'quality': 0x32,
            'background': "#000000"
          });
          await _0x317755.toFile('st1.webp');
          var _0x3b17d5 = await recupererActionJid(_0x590a2e);
          if (_0x3b17d5 === "remove") {
            _0x2b9ec8 += "message deleted \n @" + _0x1237bb.split('@')[0x0] + " removed from group.";
            await _0x3d26aa.sendMessage(_0x590a2e, {
              'sticker': fs.readFileSync("st1.webp")
            });
            0x0;
            baileys_1.delay(0x320);
            await _0x3d26aa.sendMessage(_0x590a2e, {
              'text': _0x2b9ec8,
              'mentions': [_0x1237bb]
            }, {
              'quoted': _0x4255fa
            });
            try {
              await _0x3d26aa.groupParticipantsUpdate(_0x590a2e, [_0x1237bb], "remove");
            } catch (_0x5d7c58) {
              console.log("antiien ") + _0x5d7c58;
            }
            await _0x3d26aa.sendMessage(_0x590a2e, {
              'delete': _0x373901
            });
            await fs.unlink("st1.webp");
          } else {
            if (_0x3b17d5 === "delete") {
              _0x2b9ec8 += "message deleted \n @" + _0x1237bb.split('@')[0x0] + " avoid sending link.";
              await _0x3d26aa.sendMessage(_0x590a2e, {
                'text': _0x2b9ec8,
                'mentions': [_0x1237bb]
              }, {
                'quoted': _0x4255fa
              });
              await _0x3d26aa.sendMessage(_0x590a2e, {
                'delete': _0x373901
              });
              await fs.unlink('st1.webp');
            } else {
              if (_0x3b17d5 === "warn") {
                const {
                  getWarnCountByJID: _0x267882,
                  ajouterUtilisateurAvecWarnCount: _0x192625
                } = require("./bdd/warn");
                let _0xcc7620 = await _0x267882(_0x1237bb);
                let _0x2e745f = conf.WARN_COUNT;
                if (_0xcc7620 >= _0x2e745f) {
                  var _0x5d4d4e = "link detected , you will be remove because of reaching warn-limit";
                  await _0x3d26aa.sendMessage(_0x590a2e, {
                    'text': _0x5d4d4e,
                    'mentions': [_0x1237bb]
                  }, {
                    'quoted': _0x4255fa
                  });
                  await _0x3d26aa.groupParticipantsUpdate(_0x590a2e, [_0x1237bb], "remove");
                  await _0x3d26aa.sendMessage(_0x590a2e, {
                    'delete': _0x373901
                  });
                } else {
                  var _0x2868aa = _0x2e745f - _0xcc7620;
                  var _0x30e4db = "Link detected , your warn_count was upgrade ;\n rest : " + _0x2868aa + " ";
                  await _0x192625(_0x1237bb);
                  await _0x3d26aa.sendMessage(_0x590a2e, {
                    'text': _0x30e4db,
                    'mentions': [_0x1237bb]
                  }, {
                    'quoted': _0x4255fa
                  });
                  await _0x3d26aa.sendMessage(_0x590a2e, {
                    'delete': _0x373901
                  });
                }
              }
            }
          }
        }
      } catch (_0x399040) {
        console.log("bdd err " + _0x399040);
      }
      try {
        const _0x4ebefc = _0x4255fa.key?.['id']?.['startsWith']("BAES") && _0x4255fa.key?.['id']?.['length'] === 0x10;
        const _0x29f983 = _0x4255fa.key?.['id']?.["startsWith"]("BAE5") && _0x4255fa.key?.['id']?.["length"] === 0x10;
        if (_0x4ebefc || _0x29f983) {
          if (_0x16ac52 === "reactionMessage") {
            console.log("Je ne reagis pas au reactions");
            return;
          }
          ;
          const _0x2c8338 = await atbverifierEtatJid(_0x590a2e);
          if (!_0x2c8338) {
            return;
          }
          ;
          if (_0x2dfb52 || _0x1237bb === _0x288042) {
            console.log("je fais rien");
            return;
          }
          ;
          const _0x3f9315 = {
            'remoteJid': _0x590a2e,
            'fromMe': false,
            'id': _0x4255fa.key.id,
            'participant': _0x1237bb
          };
          var _0x2b9ec8 = "bot detected, \n";
          var _0x317755 = new Sticker("https://raw.githubusercontent.com/djalega8000/Zokou-MD/main/media/remover.gif", {
            'pack': "Zoou-Md",
            'author': conf.OWNER_NAME,
            'type': StickerTypes.FULL,
            'categories': ['🤩', '🎉'],
            'id': '12345',
            'quality': 0x32,
            'background': "#000000"
          });
          await _0x317755.toFile("st1.webp");
          var _0x3b17d5 = await atbrecupererActionJid(_0x590a2e);
          if (_0x3b17d5 === "remove") {
            _0x2b9ec8 += "message deleted \n @" + _0x1237bb.split('@')[0x0] + " removed from group.";
            await _0x3d26aa.sendMessage(_0x590a2e, {
              'sticker': fs.readFileSync("st1.webp")
            });
            0x0;
            baileys_1.delay(0x320);
            await _0x3d26aa.sendMessage(_0x590a2e, {
              'text': _0x2b9ec8,
              'mentions': [_0x1237bb]
            }, {
              'quoted': _0x4255fa
            });
            try {
              await _0x3d26aa.groupParticipantsUpdate(_0x590a2e, [_0x1237bb], 'remove');
            } catch (_0x9ecaf2) {
              console.log("antibot ") + _0x9ecaf2;
            }
            await _0x3d26aa.sendMessage(_0x590a2e, {
              'delete': _0x3f9315
            });
            await fs.unlink("st1.webp");
          } else {
            if (_0x3b17d5 === "delete") {
              _0x2b9ec8 += "message delete \n @" + _0x1237bb.split('@')[0x0] + " Avoid sending link.";
              await _0x3d26aa.sendMessage(_0x590a2e, {
                'text': _0x2b9ec8,
                'mentions': [_0x1237bb]
              }, {
                'quoted': _0x4255fa
              });
              await _0x3d26aa.sendMessage(_0x590a2e, {
                'delete': _0x3f9315
              });
              await fs.unlink('st1.webp');
            } else {
              if (_0x3b17d5 === "warn") {
                const {
                  getWarnCountByJID: _0x2b9caf,
                  ajouterUtilisateurAvecWarnCount: _0x2999fa
                } = require('./bdd/warn');
                let _0x3e0cfc = await _0x2b9caf(_0x1237bb);
                let _0x4cbe91 = conf.WARN_COUNT;
                if (_0x3e0cfc >= _0x4cbe91) {
                  var _0x5d4d4e = "bot detected ;you will be remove because of reaching warn-limit";
                  await _0x3d26aa.sendMessage(_0x590a2e, {
                    'text': _0x5d4d4e,
                    'mentions': [_0x1237bb]
                  }, {
                    'quoted': _0x4255fa
                  });
                  await _0x3d26aa.groupParticipantsUpdate(_0x590a2e, [_0x1237bb], "remove");
                  await _0x3d26aa.sendMessage(_0x590a2e, {
                    'delete': _0x3f9315
                  });
                } else {
                  var _0x2868aa = _0x4cbe91 - _0x3e0cfc;
                  var _0x30e4db = "bot detected , your warn_count was upgrade ;\n rest : " + _0x2868aa + " ";
                  await _0x2999fa(_0x1237bb);
                  await _0x3d26aa.sendMessage(_0x590a2e, {
                    'text': _0x30e4db,
                    'mentions': [_0x1237bb]
                  }, {
                    'quoted': _0x4255fa
                  });
                  await _0x3d26aa.sendMessage(_0x590a2e, {
                    'delete': _0x3f9315
                  });
                }
              }
            }
          }
        }
      } catch (_0xe5e34) {
        console.log(".... " + _0xe5e34);
      }
      if (_0x2eb5b3) {
        const _0x45d07b = evt.cm.find(_0x21212a => _0x21212a.nomCom === _0x2cc9e5);
        if (_0x45d07b) {
          try {
            if (conf.MODE.toLocaleLowerCase() != "yes" && !_0x2020e6) {
              return;
            }
            if (!_0x2020e6 && _0x590a2e === _0x1237bb && conf.PM_PERMIT === "yes") {
              _0x4f4caf("You don't have acces to commands here");
              return;
            }
            if (!_0x2020e6 && _0x909aea) {
              let _0x3dfb89 = await isGroupBanned(_0x590a2e);
              if (_0x3dfb89) {
                return;
              }
            }
            if (!_0x2dfb52 && _0x909aea) {
              let _0x34345f = await isGroupOnlyAdmin(_0x590a2e);
              if (_0x34345f) {
                return;
              }
            }
            if (!_0x2020e6) {
              let _0x141cb4 = await isUserBanned(_0x1237bb);
              if (_0x141cb4) {
                _0x4f4caf("You are banned from bot commands");
                return;
              }
            }
            reagir(_0x590a2e, _0x3d26aa, _0x4255fa, _0x45d07b.reaction);
            _0x45d07b.fonction(_0x590a2e, _0x3d26aa, _0x3af7c1);
          } catch (_0x19c50e) {
            console.log("😡😡 " + _0x19c50e);
            _0x3d26aa.sendMessage(_0x590a2e, {
              'text': "😡😡 " + _0x19c50e
            }, {
              'quoted': _0x4255fa
            });
          }
        }
      }
    });
    const {
      recupevents: _0x58c6ba
    } = require('./bdd/welcome');
    _0x3d26aa.ev.on("group-participants.update", async _0x4d1ea9 => {
      console.log(_0x4d1ea9);
      let _0x24f3c5;
      try {
        _0x24f3c5 = await _0x3d26aa.profilePictureUrl(_0x4d1ea9.id, 'image');
      } catch {
        _0x24f3c5 = '';
      }
      try {
        const _0x3b3319 = await _0x3d26aa.groupMetadata(_0x4d1ea9.id);
        if (_0x4d1ea9.action == "add" && (await _0x58c6ba(_0x4d1ea9.id, "welcome")) == 'on') {
          let _0x95f6cb = "*SEBASTIAN MD-BOT WELCOME MESSAGE*";
          let _0x1c0fbf = _0x4d1ea9.participants;
          for (let _0x41a2d5 of _0x1c0fbf) {
            _0x95f6cb += " \n❒ *Hey* 🖐️ @" + _0x41a2d5.split('@')[0x0] + " WELCOME TO OUR GROUP. \n\n";
          }
          _0x95f6cb += "❒ *READ THE GROUP DESCRIPTION TO AVOID GETTING REMOVED* ";
          _0x3d26aa.sendMessage(_0x4d1ea9.id, {
            'image': {
              'url': _0x24f3c5
            },
            'caption': _0x95f6cb,
            'mentions': _0x1c0fbf
          });
        } else {
          if (_0x4d1ea9.action == "remove" && (await _0x58c6ba(_0x4d1ea9.id, "goodbye")) == 'on') {
            let _0x478c58 = "one or somes member(s) left group;\n";
            let _0x462dfa = _0x4d1ea9.participants;
            for (let _0x173264 of _0x462dfa) {
              _0x478c58 += '@' + _0x173264.split('@')[0x0] + "\n";
            }
            _0x3d26aa.sendMessage(_0x4d1ea9.id, {
              'text': _0x478c58,
              'mentions': _0x462dfa
            });
          } else {
            if (_0x4d1ea9.action == 'promote' && (await _0x58c6ba(_0x4d1ea9.id, "antipromote")) == 'on') {
              if (_0x4d1ea9.author == _0x3b3319.owner || _0x4d1ea9.author == conf.NUMERO_OWNER + "@s.whatsapp.net" || _0x4d1ea9.author == decodeJid(_0x3d26aa.user.id) || _0x4d1ea9.author == _0x4d1ea9.participants[0x0]) {
                console.log("Cas de superUser je fais rien");
                return;
              }
              ;
              await _0x3d26aa.groupParticipantsUpdate(_0x4d1ea9.id, [_0x4d1ea9.author, _0x4d1ea9.participants[0x0]], 'demote');
              _0x3d26aa.sendMessage(_0x4d1ea9.id, {
                'text': '@' + _0x4d1ea9.author.split('@')[0x0] + " has violated the anti-promotion rule, therefore both " + _0x4d1ea9.author.split('@')[0x0] + " and @" + _0x4d1ea9.participants[0x0].split('@')[0x0] + " have been removed from administrative rights.",
                'mentions': [_0x4d1ea9.author, _0x4d1ea9.participants[0x0]]
              });
            } else {
              if (_0x4d1ea9.action == "demote" && (await _0x58c6ba(_0x4d1ea9.id, "antidemote")) == 'on') {
                if (_0x4d1ea9.author == _0x3b3319.owner || _0x4d1ea9.author == conf.NUMERO_OWNER + '@s.whatsapp.net' || _0x4d1ea9.author == decodeJid(_0x3d26aa.user.id) || _0x4d1ea9.author == _0x4d1ea9.participants[0x0]) {
                  console.log("Cas de superUser je fais rien");
                  return;
                }
                ;
                await _0x3d26aa.groupParticipantsUpdate(_0x4d1ea9.id, [_0x4d1ea9.author], "demote");
                await _0x3d26aa.groupParticipantsUpdate(_0x4d1ea9.id, [_0x4d1ea9.participants[0x0]], "promote");
                _0x3d26aa.sendMessage(_0x4d1ea9.id, {
                  'text': '@' + _0x4d1ea9.author.split('@')[0x0] + " has violated the anti-demotion rule by removing @" + _0x4d1ea9.participants[0x0].split('@')[0x0] + ". Consequently, he has been stripped of administrative rights.",
                  'mentions': [_0x4d1ea9.author, _0x4d1ea9.participants[0x0]]
                });
              }
            }
          }
        }
      } catch (_0x1156d8) {
        console.error(_0x1156d8);
      }
    });
    async function _0x1c83d3() {
      const _0x26cf38 = require("node-cron");
      const {
        getCron: _0x4da360
      } = require("./bdd/cron");
      let _0x4cf033 = await _0x4da360();
      console.log(_0x4cf033);
      if (_0x4cf033.length > 0x0) {
        for (let _0x2914a8 = 0x0; _0x2914a8 < _0x4cf033.length; _0x2914a8++) {
          if (_0x4cf033[_0x2914a8].mute_at != null) {
            let _0x54dc1a = _0x4cf033[_0x2914a8].mute_at.split(':');
            console.log("etablissement d'un automute pour " + _0x4cf033[_0x2914a8].group_id + " a " + _0x54dc1a[0x0] + " H " + _0x54dc1a[0x1]);
            _0x26cf38.schedule(_0x54dc1a[0x1] + " " + _0x54dc1a[0x0] + " * * *", async () => {
              await _0x3d26aa.groupSettingUpdate(_0x4cf033[_0x2914a8].group_id, 'announcement');
              _0x3d26aa.sendMessage(_0x4cf033[_0x2914a8].group_id, {
                'image': {
                  'url': './media/chrono.webp'
                },
                'caption': "Hello, it's time to close the group; sayonara."
              });
            }, {
              'timezone': 'Africa/Nairobi'
            });
          }
          if (_0x4cf033[_0x2914a8].unmute_at != null) {
            let _0x4e2e6c = _0x4cf033[_0x2914a8].unmute_at.split(':');
            console.log("etablissement d'un autounmute pour " + _0x4e2e6c[0x0] + " H " + _0x4e2e6c[0x1] + " ");
            _0x26cf38.schedule(_0x4e2e6c[0x1] + " " + _0x4e2e6c[0x0] + " * * *", async () => {
              await _0x3d26aa.groupSettingUpdate(_0x4cf033[_0x2914a8].group_id, "not_announcement");
              _0x3d26aa.sendMessage(_0x4cf033[_0x2914a8].group_id, {
                'image': {
                  'url': './media/chrono.webp'
                },
                'caption': "Good morning; It's time to open the group."
              });
            }, {
              'timezone': 'Africa/Nairobi'
            });
          }
        }
      } else {
        console.log("Les crons n'ont pas été activés");
      }
      return;
    }
    _0x3d26aa.ev.on("contacts.upsert", async _0xa9613e => {
      const _0x331aa9 = _0x5527f8 => {
        for (const _0x1b1a96 of _0x5527f8) {
          if (store.contacts[_0x1b1a96.id]) {
            Object.assign(store.contacts[_0x1b1a96.id], _0x1b1a96);
          } else {
            store.contacts[_0x1b1a96.id] = _0x1b1a96;
          }
        }
        return;
      };
      _0x331aa9(_0xa9613e);
    });
    _0x3d26aa.ev.on('connection.update', async _0x29464b => {
      const {
        lastDisconnect: _0x4b6a81,
        connection: _0x40ea3c
      } = _0x29464b;
      if (_0x40ea3c === "connecting") {
        console.log("ℹ️ SEBASTIAN MD is connecting...");
      } else {
        if (_0x40ea3c === "open") {
          console.log("✅ SEBASTIAN MD Connected to WhatsApp! ☺️");
          console.log('--');
          0x0;
          await baileys_1.delay(0xc8);
          console.log("------");
          0x0;
          await baileys_1.delay(0x12c);
          console.log("------------------/-----");
          console.log("SEBASTIAN MD is Online 🕸\n\n");
          console.log("Loading SEBASTIAN MD Commands ...\n");
          fs.readdirSync(__dirname + "/commandes").forEach(_0x454b2d => {
            if (path.extname(_0x454b2d).toLowerCase() == '.js') {
              try {
                require(__dirname + '/commandes/' + _0x454b2d);
                console.log(_0x454b2d + " Installed Successfully✔️");
              } catch (_0x984cd0) {
                console.log(_0x454b2d + " could not be installed due to : " + _0x984cd0);
              }
              0x0;
              baileys_1.delay(0x12c);
            }
          });
          0x0;
          baileys_1.delay(0x2bc);
          var _0x27a07e;
          if (conf.MODE.toLocaleLowerCase() === "yes") {
            _0x27a07e = "public";
          } else if (conf.MODE.toLocaleLowerCase() === 'no') {
            _0x27a07e = 'private';
          } else {
            _0x27a07e = "undefined";
          }
          console.log("Commands Installation Completed ✅");
          await _0x1c83d3();
          if (conf.DP.toLowerCase() === "yes") {
            let _0x15862a = " ⁠⁠⁠⁠\n╭─────────────━┈⊷ \n│ *SEBASTIAN MD CONNECTED*\n╰─────────────━┈⊷\n│ ᴘʀᴇғɪx: *[ " + prefixe + " ]*\n│ ᴍᴏᴅᴇ: *" + _0x27a07e + "*\n╰─────────────━┈⊷         \n                 ";
            await _0x3d26aa.sendMessage(_0x3d26aa.user.id, {
              'text': _0x15862a
            });
          }
        } else {
          if (_0x40ea3c == "close") {
            let _0x28cd63 = new boom_1.Boom(_0x4b6a81?.["error"])?.["output"]['statusCode'];
            if (_0x28cd63 === baileys_1.DisconnectReason.badSession) {
              console.log("Session id error, rescan again...");
            } else {
              if (_0x28cd63 === baileys_1.DisconnectReason.connectionClosed) {
                console.log("!!! connexion fermée, reconnexion en cours ...");
                _0x568e34();
              } else {
                if (_0x28cd63 === baileys_1.DisconnectReason.connectionLost) {
                  console.log("connection error 😞 ,,, trying to reconnect... ");
                  _0x568e34();
                } else {
                  if (_0x28cd63 === baileys_1.DisconnectReason?.['connectionReplaced']) {
                    console.log("connexion réplacée ,,, une sesssion est déjà ouverte veuillez la fermer svp !!!");
                  } else {
                    if (_0x28cd63 === baileys_1.DisconnectReason.loggedOut) {
                      console.log("vous êtes déconnecté,,, veuillez rescanner le code qr svp");
                    } else {
                      if (_0x28cd63 === baileys_1.DisconnectReason.restartRequired) {
                        console.log("redémarrage en cours ▶️");
                        _0x568e34();
                      } else {
                        console.log("redemarrage sur le coup de l'erreur  ", _0x28cd63);
                        const {
                          exec: _0x597219
                        } = require('child_process');
                        _0x597219("pm2 restart all");
                      }
                    }
                  }
                }
              }
            }
            console.log("hum " + _0x40ea3c);
            _0x568e34();
          }
        }
      }
    });
    _0x3d26aa.ev.on('creds.update', _0x356ea6);
    _0x3d26aa.downloadAndSaveMediaMessage = async (_0x4be346, _0x253401 = '', _0x22c4c3 = true) => {
      let _0x14987c = _0x4be346.msg ? _0x4be346.msg : _0x4be346;
      let _0x1c5fc0 = (_0x4be346.msg || _0x4be346).mimetype || '';
      let _0x360b1b = _0x4be346.mtype ? _0x4be346.mtype.replace(/Message/gi, '') : _0x1c5fc0.split('/')[0x0];
      0x0;
      const _0x12b9cd = await baileys_1.downloadContentFromMessage(_0x14987c, _0x360b1b);
      let _0xd1a09a = Buffer.from([]);
      for await (const _0xe2ec57 of _0x12b9cd) {
        _0xd1a09a = Buffer.concat([_0xd1a09a, _0xe2ec57]);
      }
      let _0x316798 = await FileType.fromBuffer(_0xd1a09a);
      let _0x211a07 = './' + _0x253401 + '.' + _0x316798.ext;
      await fs.writeFileSync(_0x211a07, _0xd1a09a);
      return _0x211a07;
    };
    _0x3d26aa.awaitForMessage = async (_0x4123a9 = {}) => {
      return new Promise((_0xd59ae7, _0x4e861e) => {
        if (typeof _0x4123a9 !== "object") {
          _0x4e861e(new Error("Options must be an object"));
        }
        if (typeof _0x4123a9.sender !== "string") {
          _0x4e861e(new Error("Sender must be a string"));
        }
        if (typeof _0x4123a9.chatJid !== "string") {
          _0x4e861e(new Error("ChatJid must be a string"));
        }
        if (_0x4123a9.timeout && typeof _0x4123a9.timeout !== "number") {
          _0x4e861e(new Error("Timeout must be a number"));
        }
        if (_0x4123a9.filter && typeof _0x4123a9.filter !== "function") {
          _0x4e861e(new Error("Filter must be a function"));
        }
        const _0x1bdf37 = _0x4123a9?.["timeout"] || undefined;
        const _0x392d58 = _0x4123a9?.["filter"] || (() => true);
        let _0x3e25bb = undefined;
        let _0x5c935f = _0x4a02a2 => {
          let {
            type: _0x2e8a60,
            messages: _0x3588ea
          } = _0x4a02a2;
          if (_0x2e8a60 == "notify") {
            for (let _0x560f2f of _0x3588ea) {
              const _0x482e36 = _0x560f2f.key.fromMe;
              const _0x3bf3a1 = _0x560f2f.key.remoteJid;
              const _0x12b83e = _0x3bf3a1.endsWith("@g.us");
              const _0x30c96e = _0x3bf3a1 == 'status@broadcast';
              const _0x1aa189 = _0x482e36 ? _0x3d26aa.user.id.replace(/:.*@/g, '@') : _0x12b83e || _0x30c96e ? _0x560f2f.key.participant.replace(/:.*@/g, '@') : _0x3bf3a1;
              if (_0x1aa189 == _0x4123a9.sender && _0x3bf3a1 == _0x4123a9.chatJid && _0x392d58(_0x560f2f)) {
                _0x3d26aa.ev.off("messages.upsert", _0x5c935f);
                clearTimeout(_0x3e25bb);
                _0xd59ae7(_0x560f2f);
              }
            }
          }
        };
        _0x3d26aa.ev.on("messages.upsert", _0x5c935f);
        if (_0x1bdf37) {
          _0x3e25bb = setTimeout(() => {
            _0x3d26aa.ev.off("messages.upsert", _0x5c935f);
            _0x4e861e(new Error("Timeout"));
          }, _0x1bdf37);
        }
      });
    };
    return _0x3d26aa;
  }
  let _0x10ad7b = require.resolve(__filename);
  fs.watchFile(_0x10ad7b, () => {
    fs.unwatchFile(_0x10ad7b);
    console.log("mise à jour " + __filename);
    delete require.cache[_0x10ad7b];
    require(_0x10ad7b);
  });
  _0x568e34();
}, 0x1388);
