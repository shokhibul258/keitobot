require('dotenv').config();
const axios = require('axios');
const chalk = require('chalk');

const config = {
  uid: process.env.UID,
  baseUrl: "https://game.keitokun.com/api/v1",
  token: process.env.X_TOKEN,
  cookies: process.env.COOKIES,
  userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36",
  checkInterval: 60 * 1000,
  questCheckInterval: 5 * 60 * 1000,
  logLevel: 1
};

let gameState = {
  keitoAmount: 0,
  todayPlayTimes: 0,
  todayQuota: 0,
  todayRemainPlayTimes: 0,
  nextDrop: 0,
  states: "",
  lastCheck: 0
};

let userState = {
  uid: config.uid,
  nickName: "",
  address: "",
  keito: 0,
  level: 0
};

function generateHeaders(appkey) {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  return {
    "accept": "*/*",
    "accept-language": "en-US,en;q=0.7",
    "appkey": appkey,
    "content-type": "application/json",
    "sec-ch-ua": "\"Chromium\";v=\"134\", \"Not:A-Brand\";v=\"24\", \"Brave\";v=\"134\"",
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": "\"Windows\"",
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-origin",
    "sec-gpc": "1",
    "timestamp": timestamp,
    "x-token": config.token,
    "cookie": config.cookies,
    "Referer": "https://game.keitokun.com/",
    "Referrer-Policy": "strict-origin-when-cross-origin"
  };
}

async function getGameInfo() {
  try {
    const response = await axios.get(
      `${config.baseUrl}/keito/getShowerInfo?uid=${config.uid}`,
      { headers: generateHeaders("c7a47223c7ca9fce4023b5835695e5c3") }
    );
    if (response.data.code === 0) {
      updateGameState(response.data.data);
      logGameState();
      return response.data.data;
    }
    console.error(chalk.red(`Error getting game info: ${response.data.msg}`));
    return null;
  } catch (error) {
    console.error(chalk.red(`Network error getting game info: ${error.message}`));
    return null;
  }
}

async function getUserInfo() {
  try {
    const response = await axios.get(
      `${config.baseUrl}/user/getUserInfo?uid=${config.uid}`,
      { headers: generateHeaders("3bb11df52672624496e4d5cdb7816390") }
    );
    if (response.data.code === 0) {
      userState = response.data.data;
      console.log(chalk.cyan("-----------------"));
      console.log(chalk.green(`👤 User: ${userState.nickName}`));
      console.log(chalk.green(`💰 Total Keito: ${userState.keito}`));
      console.log(chalk.green(`🏆 Level: ${userState.level}`));
      console.log(chalk.green(`🔑 Wallet: ${userState.address}`));
      console.log(chalk.cyan("-----------------"));
      return response.data.data;
    }
    console.error(chalk.red(`Error getting user info: ${response.data.msg}`));
    return null;
  } catch (error) {
    console.error(chalk.red(`Network error getting user info: ${error.message}`));
    return null;
  }
}

async function getQuestStates() {
  try {
    const response = await axios.get(
      `${config.baseUrl}/quest/getStatesList?uid=${config.uid}`,
      { headers: generateHeaders("951bf0b28e774a093b392a4bef60e1e3") }
    );
    if (response.data.code === 0) {
      console.log(chalk.green("📋 Retrieved quest states successfully"));
      if (config.logLevel >= 2) console.log(chalk.cyan(JSON.stringify(response.data.data, null, 2)));
      return response.data.data;
    }
    console.error(chalk.red(`Error getting quests: ${response.data.msg}`));
    return null;
  } catch (error) {
    console.error(chalk.red(`Network error getting quests: ${error.message}`));
    return null;
  }
}

async function claimQuest(questType) {
  try {
    console.log(chalk.yellow(`🎯 Claiming quest reward for: ${questType}`));
    const appkeys = {
      "followBanana": "e0d64fbcf3c53cf23034420d69ac88fc",
      "palyBanana": "cdb2a58a16f377ae6784c630cb3f995b",
      "tryShowerReward": "41f1f53fe7c48c17396507f924bd0f19",
      "collect50Reward": "435412616d82610b043543e3120dee00",
      "visitWebsiteReward": "2a6378af42b86b25130ddaa8c5021cc6",
      "followOAReward": "4926917f6b857c2c8787bd4ac29a52c9",
      "followTwReward": "e86246c4922048b8c829a552aa2e9eee",
      "JoinOpenchatReward": "34b1a67920d5bcb45fa8643b2c9f9c25",
      "repostXReward": "a4261847b395d5b05d5748458192e78e",
      "joinTGGroupReward": "17cbab6cd7921851319b73540a5e1fac",
      "readHowToPlayReward": "f41e410b4738ac174e4a5fc61c0c9445",
      "likeCommentTweetReward": "202ef912aae01d3d9c43bbed6a41351a",
      "launchingPromotion": "951bf0b28e774a093b392a4bef60e1e3",
      "reKnitSweaterReward": "951bf0b28e774a093b392a4bef60e1e3",
      "invite3Reward": "951bf0b28e774a093b392a4bef60e1e3",
      "checkinOnchainReward": "951bf0b28e774a093b392a4bef60e1e3",
      "uploadLuckOnchainReward": "951bf0b28e774a093b392a4bef60e1e3"
    };
    const appkey = appkeys[questType] || "951bf0b28e774a093b392a4bef60e1e3";
    
    const response = await axios.post(
      `${config.baseUrl}/quest/claim`,
      { uid: config.uid, kType: questType },
      { headers: generateHeaders(appkey) }
    );
    if (response.data.code === 0) {
      console.log(chalk.green(`✅ Successfully claimed quest reward for: ${questType}`));
      return true;
    }
    console.error(chalk.red(`Error claiming quest reward: ${response.data.msg}`));
    return false;
  } catch (error) {
    console.error(chalk.red(`Network error claiming quest: ${error.message}`));
    return false;
  }
}

async function processQuests() {
  console.log(chalk.yellow("🔍 Checking quests..."));
  const quests = await getQuestStates();
  if (!quests) {
    console.log(chalk.red("⚠️ Failed to get quests, will try again later"));
    return;
  }
  
  console.log(chalk.cyan("-----------------"));
  let claimedAny = false;
  for (const quest of quests) {
    const kType = quest.kType || (quest.subGroupList ? quest.subGroupList.map(sub => sub.kType) : []);
    if (Array.isArray(kType)) {
      for (const subKType of kType) {
        await processSingleQuest(subKType, quest.subGroupList.find(sub => sub.kType === subKType));
      }
    } else if (kType) {
      await processSingleQuest(kType, quest);
    }
  }
  
  async function processSingleQuest(kType, questData) {
    if (!questData.states) return;
    
    if (questData.states === "unfinish") {
      console.log(chalk.yellow(`⏳ Quest in progress: ${kType} - Not completed yet`));
    } else if (questData.states === "unClaim" || questData.states === "unclaim") {
      console.log(chalk.green(`🎁 Found completed quest: ${kType} ready for claiming`));
      const claimed = await claimQuest(kType);
      if (claimed) claimedAny = true;
      await new Promise(resolve => setTimeout(resolve, 1000));
    } else if (questData.states === "claimed") {
      console.log(chalk.cyan(`✓ Quest already claimed: ${kType}`));
    }
  }
  
  if (claimedAny) await getUserInfo();
  console.log(chalk.cyan("-----------------"));
  console.log(chalk.cyan(`🕒 Next quest check in ${config.questCheckInterval/1000} seconds`));
  setTimeout(processQuests, config.questCheckInterval);
}

async function startPlaying() {
  try {
    console.log(chalk.yellow("🎮 Starting game..."));
    const response = await axios.post(
      `${config.baseUrl}/keito/shower`,
      { assetList: [], uid: config.uid, cmd: "start" },
      { headers: generateHeaders("ada4978ea3bc0dd4814047db85723d72") }
    );
    if (response.data.code === 0) {
      console.log(chalk.green("✅ Game started successfully"));
      return true;
    }
    console.error(chalk.red(`Error starting game: ${response.data.msg}`));
    return false;
  } catch (error) {
    console.error(chalk.red(`Network error starting game: ${error.message}`));
    return false;
  }
}

async function endGame() {
  try {
    const keitoCollected = Math.floor(Math.random() * (60 - 40 + 1)) + 40;
    console.log(chalk.yellow(`💰 Ending game, collected ${keitoCollected} keito`));
    const response = await axios.post(
      `${config.baseUrl}/keito/shower`,
      { assetList: [{ assetId: "1", amount: keitoCollected }], uid: config.uid, cmd: "end" },
      { headers: generateHeaders("8c3d433646d59f2eced0a0c8d9d037ed") }
    );
    if (response.data.code === 0) {
      updateGameState(response.data.data);
      console.log(chalk.green(`✅ Game ended successfully, collected ${keitoCollected} keito`));
      return true;
    }
    console.error(chalk.red(`Error ending game: ${response.data.msg}`));
    return false;
  } catch (error) {
    console.error(chalk.red(`Network error ending game: ${error.message}`));
    return false;
  }
}

async function getTotalKeito() {
  try {
    const response = await axios.get(
      `${config.baseUrl}/keito/getTotalAmount?uid=${config.uid}`,
      { headers: generateHeaders("6bb02302f83f2d1fcf3f4b8d171c3365") }
    );
    if (response.data.code === 0) {
      console.log(chalk.green(`💰 Total keito: ${response.data.data}`));
      return response.data.data;
    }
    console.error(chalk.red(`Error getting total keito: ${response.data.msg}`));
    return null;
  } catch (error) {
    console.error(chalk.red(`Network error getting total keito: ${error.message}`));
    return null;
  }
}

function updateGameState(data) {
  gameState = {
    ...gameState,
    keitoAmount: data.keitoAmount,
    todayPlayTimes: data.todayPlayTimes,
    todayQuota: data.todayQuota,
    todayRemainPlayTimes: data.todayRemainPlayTimes,
    nextDrop: data.nextDrop,
    states: data.states,
    lastCheck: Date.now()
  };
}

function logGameState() {
  if (config.logLevel >= 1) {
    console.log(chalk.cyan("-----------------"));
    console.log(chalk.cyan("--- Game State ---"));
    console.log(chalk.green(`Keito Amount: ${gameState.keitoAmount}`));
    console.log(chalk.green(`Today's Plays: ${gameState.todayPlayTimes}/${gameState.todayQuota}`));
    console.log(chalk.green(`Remaining Plays: ${gameState.todayRemainPlayTimes}`));
    console.log(chalk.yellow(`Next Drop: ${gameState.nextDrop > 0 ? `in ${formatTime(gameState.nextDrop)} seconds` : "Available now!"}`));
    console.log(chalk.cyan(`Game State: ${gameState.states}`));
    console.log(chalk.cyan(`Last Checked: ${new Date().toLocaleTimeString()}`));
    console.log(chalk.cyan("-----------------"));
  }
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

function startCountdown(seconds, callback) {
  let remaining = seconds;
  
  console.log(chalk.yellow(`⏳ Next Drop countdown started: ${formatTime(remaining)}`));
  
  const interval = setInterval(() => {
    remaining--;
    process.stdout.write(chalk.yellow(`\r⏳ Next Drop: ${formatTime(remaining)}`));
    
    if (remaining <= 0) {
      clearInterval(interval);
      console.log(chalk.green('\n🎯 Drop is available now!'));
      callback();
    }
  }, 1000);
}

async function gameLoop() {
  const info = await getGameInfo();
  if (!info) {
    console.log(chalk.red("⚠️ Failed to get game info, retrying in 30 seconds..."));
    setTimeout(gameLoop, 30000);
    return;
  }
  
  if (info.todayRemainPlayTimes <= 0) {
    console.log(chalk.red("⚠️ Out of plays for today. Checking again tomorrow."));
    setTimeout(gameLoop, 60 * 60 * 1000);
    return;
  }
  
  if (info.nextDrop <= 0) {
    console.log(chalk.green("🎯 Drop is available! Starting game..."));
    const startSuccess = await startPlaying();
    if (!startSuccess) {
      console.log(chalk.red("⚠️ Failed to start game, retrying in 30 seconds..."));
      setTimeout(gameLoop, 30000);
      return;
    }
    
    const playTime = Math.floor(Math.random() * (5000 - 3000 + 1)) + 3000;
    console.log(chalk.yellow(`🕹️ Playing for ${playTime/1000} seconds...`));
    
    setTimeout(async () => {
      const endSuccess = await endGame();
      if (!endSuccess) {
        console.log(chalk.red("⚠️ Failed to end game, retrying in 30 seconds..."));
        setTimeout(gameLoop, 30000);
        return;
      }
      
      await getTotalKeito();
      await processQuests();
      console.log(chalk.cyan(`🕒 Next game check in ${config.checkInterval/1000} seconds`));
      setTimeout(gameLoop, config.checkInterval);
    }, playTime);
  } else {
    startCountdown(info.nextDrop, async () => {
      console.log(chalk.green("🎯 Drop is available! Starting game..."));
      const startSuccess = await startPlaying();
      if (!startSuccess) {
        console.log(chalk.red("⚠️ Failed to start game, retrying in 30 seconds..."));
        setTimeout(gameLoop, 30000);
        return;
      }
      
      const playTime = Math.floor(Math.random() * (5000 - 3000 + 1)) + 3000;
      console.log(chalk.yellow(`🕹️ Playing for ${playTime/1000} seconds...`));
      
      setTimeout(async () => {
        const endSuccess = await endGame();
        if (!endSuccess) {
          console.log(chalk.red("⚠️ Failed to end game, retrying in 30 seconds..."));
          setTimeout(gameLoop, 30000);
          return;
        }
        
        await getTotalKeito();
        await processQuests();
        console.log(chalk.cyan(`🕒 Next game check in ${config.checkInterval/1000} seconds`));
        setTimeout(gameLoop, config.checkInterval);
      }, playTime);
    });
  }
}

async function initialize() {
  console.log(chalk.green("🚀 Starting Keito Auto-Play Bot..."));
  console.log(chalk.green(`👤 User ID: ${config.uid}`));
  console.log(chalk.cyan(`🔄 Check interval: ${config.checkInterval/1000} seconds`));
  console.log(chalk.cyan("-----------------"));
  
  await getUserInfo();
  await processQuests();
  console.log(chalk.green(`🎮 Starting game loop...\n`));
  gameLoop();
}

initialize();