const { zokou } = require("../framework/zokou");
const axios = require("axios");
const conf = require("../set");
const fs = require("fs-extra");

const historyPath = './bdd/gpt_history.json';

// Initialize history file
if (!fs.existsSync('./bdd')) fs.mkdirSync('./bdd');
if (!fs.existsSync(historyPath)) {
    fs.writeFileSync(historyPath, JSON.stringify({}, null, 2));
}

// Function to get user history
function getUserHistory(userId) {
    try {
        const data = fs.readFileSync(historyPath);
        const history = JSON.parse(data);
        return history[userId] || [];
    } catch {
        return [];
    }
}

// Function to save user history
function saveUserHistory(userId, messages) {
    try {
        const data = fs.readFileSync(historyPath);
        const history = JSON.parse(data);
        history[userId] = messages.slice(-10);
        fs.writeFileSync(historyPath, JSON.stringify(history, null, 2));
    } catch (error) {
        console.log("Error saving history:", error);
    }
}

zokou({
    nomCom: "gpt",
    categorie: "AI",
    reaction: "🤖",
    desc: "Chat with GPT AI (with memory)",
    fromMe: false
}, async (dest, zk, commandeOptions) => {
    const { repondre, arg, ms, auteurMessage, superUser } = commandeOptions;

    if (!arg || arg.length === 0) {
        return repondre("❌ *Please provide your question!*\n\nExample: .gpt What is the capital of Tanzania?");
    }

    const query = arg.join(" ");
    const userId = auteurMessage || dest;
    const senderNumber = auteurMessage.split('@')[0];
    const isOwner = superUser || (senderNumber === conf.NUMERO_OWNER);
    
    const ownerName = conf.OWNER_NAME || "Rahmani";
    const ownerNumber = conf.NUMERO_OWNER || "255693629079";
    
    await repondre(`🤖 *${isOwner ? '👑 OWNER' : '🤖 GPT'} is thinking...*`);

    try {
        // Get user history
        const history = getUserHistory(userId);
        
        // Build system prompt
        let systemPrompt = `Your name is RahmaniGPT. You were created by ${ownerName} (${ownerNumber}) who is your owner. `;
        systemPrompt += `Respond respectfully and answer questions clearly. `;
        
        if (isOwner) {
            systemPrompt += `This user is your owner, ${ownerName}. Respond with special respect and provide detailed answers.`;
        } else {
            systemPrompt += `This user is not your owner. Help them but do not share personal information about the owner.`;
        }
        
        // Build conversation context
        let context = systemPrompt + "\n\n";
        if (history.length > 0) {
            context += "Previous conversation:\n";
            history.forEach(msg => {
                context += `User: ${msg.question}\nAI: ${msg.answer}\n`;
            });
            context += "\n";
        }
        
        const fullQuery = context + "Current question: " + query + "\nAnswer:";
        
        // API call
        const apiUrl = `https://api.diioffc.web.id/api/ai/gpt?text=${encodeURIComponent(fullQuery)}`;
        const response = await axios.get(apiUrl);
        
        if (response.data && response.data.result) {
            const answer = response.data.result;
            
            // Save to history
            history.push({ question: query, answer: answer });
            saveUserHistory(userId, history);
            
            const replyMsg = `╭━━━ *『 ${isOwner ? '👑 OWNER GPT' : '🤖 GPT'} 』* ━━━╮
┃
┃ 👤 *User:* ${isOwner ? ownerName + ' (Owner)' : senderNumber}
┃
┃ 🤖 *Question:* 
┃ ${query}
┃
┃ 💬 *Answer:* 
┃ ${answer}
┃
┃ 📚 *History:* ${history.length} messages
┃
╰━━━━━━━━━━━━━━━━━━━━━━━━━━╯
_Powered by ${ownerName}_`;

            await repondre(replyMsg);
        } else {
            throw new Error("No response");
        }
        
    } catch (error) {
        console.error("GPT error:", error);
        await repondre(`❌ *GPT is currently unavailable*\n\nPlease try again later.`);
    }
});

// Command to clear history
zokou({
    nomCom: "gptclear",
    categorie: "AI",
    reaction: "🧹",
    desc: "Clear your GPT conversation history",
    fromMe: false
}, async (dest, zk, commandeOptions) => {
    const { repondre, auteurMessage } = commandeOptions;
    
    const userId = auteurMessage || dest;
    
    try {
        const data = fs.readFileSync(historyPath);
        const history = JSON.parse(data);
        delete history[userId];
        fs.writeFileSync(historyPath, JSON.stringify(history, null, 2));
        
        await repondre("✅ *GPT history cleared!*");
    } catch (error) {
        await repondre("❌ *Failed to clear history*");
    }
});
