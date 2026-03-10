const { zokou } = require("../framework/zokou");
const yts = require('yt-search');
const ytdl = require('ytdl-core');
const fs = require('fs');
const axios = require('axios');
const ytdl2 = require('@distube/ytdl-core'); // Alternative ytdl

zokou({
  nomCom: "play",
  categorie: "Search",
  reaction: "🎵"
}, async (origineMessage, zk, commandeOptions) => {
  const { ms, repondre, arg } = commandeOptions;
     
  if (!arg[0]) {
    return repondre("❌ *Wrong usage!*\nExample: .play song name");
  }

  try {
    const topo = arg.join(" ");
    await repondre(`🔍 *Searching for:* ${topo}`);
    
    // Search on YouTube
    const search = await yts(topo);
    const videos = search.videos;

    if (videos && videos.length > 0 && videos[0]) {
      const video = videos[0];
      
      // Send info message
      let infoMess = {
        image: { url: video.thumbnail },
        caption: `╭━━━ *『 SEBA MD MUSIC 』* ━━━╮
┃
┃ 🎵 *Title:* ${video.title}
┃ ⏱️ *Duration:* ${video.timestamp}
┃ 👤 *Channel:* ${video.author.name}
┃ 🔗 *URL:* ${video.url}
┃
┃ ⏳ *Downloading audio...*
┃
╰━━━━━━━━━━━━━━━━━━━━━━━━━━╯
_Powered by Sebastian_`
      };
      
      await zk.sendMessage(origineMessage, infoMess, { quoted: ms });

      // ============ METHOD 1: ytdl-core ============
      try {
        const audioStream = ytdl(video.url, { 
          filter: 'audioonly', 
          quality: 'highestaudio',
          requestOptions: {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
          }
        });
        
        const filename = `audio_${Date.now()}.mp3`;
        const fileStream = fs.createWriteStream(filename);
        audioStream.pipe(fileStream);

        fileStream.on('finish', async () => {
          await zk.sendMessage(origineMessage, { 
            audio: { url: filename },
            mimetype: 'audio/mp4',
            ptt: false 
          }, { quoted: ms });
          
          // Delete file after sending
          fs.unlink(filename, () => {});
          console.log("✅ Audio sent successfully");
        });

        fileStream.on('error', async (error) => {
          console.error('❌ Audio stream error:', error);
          // Try alternative method
          await downloadAlternative(video.url, origineMessage, zk, ms, 'audio');
        });
      } catch (ytdlError) {
        console.error('❌ ytdl error:', ytdlError);
        await downloadAlternative(video.url, origineMessage, zk, ms, 'audio');
      }
    } else {
      repondre('❌ No videos found.');
    }
  } catch (error) {
    console.error('❌ Search error:', error);
    repondre('❌ An error occurred. Please try again later.');
  }
});

// Alternative download method using APIs
async function downloadAlternative(url, origineMessage, zk, ms, type) {
  try {
    await zk.sendMessage(origineMessage, { 
      text: "🔄 Using alternative download method..." 
    }, { quoted: ms });

    // API 1: YouTube to MP3
    const apiUrl = `https://youtube-mp36.p.rapidapi.com/dl?id=${extractVideoId(url)}`;
    const options = {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': 'f5a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t', // Free key - replace with yours
        'X-RapidAPI-Host': 'youtube-mp36.p.rapidapi.com'
      }
    };

    const response = await axios.get(apiUrl, options);
    
    if (response.data && response.data.link) {
      const downloadUrl = response.data.link;
      
      if (type === 'audio') {
        await zk.sendMessage(origineMessage, { 
          audio: { url: downloadUrl },
          mimetype: 'audio/mp4'
        }, { quoted: ms });
      } else {
        await zk.sendMessage(origineMessage, { 
          video: { url: downloadUrl },
          caption: "🎥 *Here's your video*"
        }, { quoted: ms });
      }
      console.log(`✅ ${type} sent via API`);
    } else {
      throw new Error('No download link found');
    }
  } catch (apiError) {
    console.error('❌ API error:', apiError);
    
    // API 2: Backup API
    try {
      const backupUrl = `https://api.akuari.my.id/downloader/ytplay?query=${encodeURIComponent(url)}`;
      const backupResponse = await axios.get(backupUrl);
      
      if (backupResponse.data && backupResponse.data.result) {
        const result = backupResponse.data.result;
        const downloadUrl = result[type === 'audio' ? 'audio' : 'video'] || result.link;
        
        if (downloadUrl) {
          await zk.sendMessage(origineMessage, { 
            [type === 'audio' ? 'audio' : 'video']: { url: downloadUrl },
            mimetype: type === 'audio' ? 'audio/mp4' : undefined,
            caption: type === 'video' ? "🎥 *Here's your video*" : undefined
          }, { quoted: ms });
          console.log(`✅ ${type} sent via backup API`);
          return;
        }
      }
      throw new Error('Backup API failed');
    } catch (backupError) {
      console.error('❌ All methods failed:', backupError);
      await zk.sendMessage(origineMessage, { 
        text: "❌ Failed to download. Here's the link instead:\n" + url 
      }, { quoted: ms });
    }
  }
}

// Helper function to extract video ID
function extractVideoId(url) {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

zokou({
  nomCom: "video",
  categorie: "Search",
  reaction: "🎥"
}, async (origineMessage, zk, commandeOptions) => {
  const { arg, ms, repondre } = commandeOptions;

  if (!arg[0]) {
    return repondre("❌ *Wrong usage!*\nExample: .video song name");
  }

  const topo = arg.join(" ");
  
  try {
    await repondre(`🔍 *Searching for:* ${topo}`);
    
    const search = await yts(topo);
    const videos = search.videos;

    if (videos && videos.length > 0 && videos[0]) {
      const video = videos[0];

      // Send info message
      let infoMess = {
        image: { url: video.thumbnail },
        caption: `╭━━━ *『 SEBA MD VIDEO 』* ━━━╮
┃
┃ 🎥 *Title:* ${video.title}
┃ ⏱️ *Duration:* ${video.timestamp}
┃ 👤 *Channel:* ${video.author.name}
┃ 🔗 *URL:* ${video.url}
┃
┃ ⏳ *Downloading video...*
┃
╰━━━━━━━━━━━━━━━━━━━━━━━━━━╯
_Powered by Sebastian_`
      };

      await zk.sendMessage(origineMessage, infoMess, { quoted: ms });

      // Try ytdl first
      try {
        const videoInfo = await ytdl.getInfo(video.url);
        const format = ytdl.chooseFormat(videoInfo.formats, { 
          quality: '18', // 360p
          filter: 'videoandaudio'
        });
        
        const videoStream = ytdl.downloadFromInfo(videoInfo, { format });
        const filename = `video_${Date.now()}.mp4`;
        const fileStream = fs.createWriteStream(filename);
        videoStream.pipe(fileStream);

        fileStream.on('finish', async () => {
          await zk.sendMessage(origineMessage, { 
            video: { url: filename },
            caption: "🎥 *Here's your video*"
          }, { quoted: ms });
          
          fs.unlink(filename, () => {});
          console.log("✅ Video sent successfully");
        });

        fileStream.on('error', async (error) => {
          console.error('❌ Video stream error:', error);
          await downloadAlternative(video.url, origineMessage, zk, ms, 'video');
        });
      } catch (ytdlError) {
        console.error('❌ ytdl error:', ytdlError);
        await downloadAlternative(video.url, origineMessage, zk, ms, 'video');
      }
    } else {
      repondre('❌ No videos found.');
    }
  } catch (error) {
    console.error('❌ Search error:', error);
    repondre('❌ An error occurred. Please try again later.');
  }
});

// Additional command: Spotify search
zokou({
  nomCom: "spotify",
  categorie: "Search",
  reaction: "🎧"
}, async (origineMessage, zk, commandeOptions) => {
  const { arg, ms, repondre } = commandeOptions;

  if (!arg[0]) {
    return repondre("❌ *Wrong usage!*\nExample: .spotify song name");
  }

  try {
    const query = arg.join(" ");
    await repondre(`🔍 *Searching on Spotify:* ${query}`);

    // Spotify search API
    const options = {
      method: 'GET',
      url: 'https://spotify23.p.rapidapi.com/search/',
      params: {
        q: query,
        type: 'tracks',
        limit: '5'
      },
      headers: {
        'X-RapidAPI-Key': 'f5a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t',
        'X-RapidAPI-Host': 'spotify23.p.rapidapi.com'
      }
    };

    const response = await axios.request(options);
    
    if (response.data && response.data.tracks && response.data.tracks.items.length > 0) {
      const tracks = response.data.tracks.items;
      let message = `╭━━━ *『 SPOTIFY SEARCH 』* ━━━╮\n┃\n`;
      
      tracks.forEach((track, index) => {
        const name = track.data.name;
        const artist = track.data.artists.items[0].profile.name;
        const duration = Math.floor(track.data.duration.totalMilliseconds / 60000);
        message += `┃ ${index + 1}. *${name}*\n┃    👤 ${artist} - ${duration}min\n┃\n`;
      });
      
      message += `╰━━━━━━━━━━━━━━━━━━━━━━━━━━╯\n_Powered by Sebastian_`;
      
      await zk.sendMessage(origineMessage, { text: message }, { quoted: ms });
    } else {
      repondre("❌ No results found on Spotify.");
    }
  } catch (error) {
    console.error("❌ Spotify error:", error);
    repondre("❌ Spotify search failed.");
  }
});
