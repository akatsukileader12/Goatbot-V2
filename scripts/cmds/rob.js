module.exports = {
  config: {
    name: "rob",
    aliases: ["steal"],
    version: "2.4",
    author: "Charles MK",
    countDown: 5,
    role: 0,
    description: "Attempt to rob another user's wallet (Limit: 2 per 60m)",
    category: "economy",
    guide: {
      en:
        "『 Rob 』\n"
      + "│\n"
      + "│ 🔹 {pn} @mention / reply / <uid>\n"
      + "│     50% chance to steal 15–35% of their wallet\n"
      + "│\n"
      + "│ ⏳ Limit: 2 attempts every 60 minutes\n"
      + "│\n"
      + "│ ⚠️ If you FAIL:\n"
      + "│     Police fine you 90% of your wallet\n"
      + "│     If wallet is empty, 90% taken from bank instead\n"
    }
  },

  onStart: async function ({ message, event, args, usersData, api }) {
    const { senderID, messageReply } = event;

    // ── Resolve target ──────────────────────────────────────────────
    let targetID;
    if (messageReply) {
      targetID = messageReply.senderID;
    } else if (Object.keys(event.mentions).length > 0) {
      targetID = Object.keys(event.mentions)[0];
    } else if (args[0] && /^\d+$/.test(args[0].replace(/[^0-9]/g, ''))) {
      targetID = args[0].replace(/[^0-9]/g, '');
    } else {
      return message.reply("❌ Please mention a user, reply to their message, or provide their UID!");
    }

    if (!targetID) return message.reply("❌ Invalid user ID!");
    if (targetID === senderID) return message.reply("🤡 You can't rob yourself, genius!");

    // ── Fetch data ──────────────────────────────────────────────────
    const robber = await usersData.get(senderID);
    const victim = await usersData.get(targetID);

    if (!robber.data) robber.data = {};
    if (!victim.data) victim.data = {};

    // ── 60-Minute Limit Logic ───────────────────────────────────────
    const now = Date.now();
    const cooldownTime = 60 * 60 * 1000; // 60 minutes in ms

    // Initialize or filter the history of timestamps
    if (!robber.data.robHistory) robber.data.robHistory = [];

    // Keep only timestamps that occurred within the last 60 minutes
    robber.data.robHistory = robber.data.robHistory.filter(time => now - time < cooldownTime);

    if (robber.data.robHistory.length >= 2) {
      const oldestAttempt = robber.data.robHistory[0];
      const timeLeft = Math.ceil((cooldownTime - (now - oldestAttempt)) / (60 * 1000));
      return message.reply(`⏳ You've reached the limit! You can rob again in **${timeLeft} minutes**.`);
    }

    const victimMoney = victim.money || 0;
    if (victimMoney < 100)
      return message.reply("💸 This user is broke! Not worth robbing.");

    // ── Update History ──────────────────────────────────────────────
    robber.data.robHistory.push(now);

    // ── Fetch names ─────────────────────────────────────────────────
    let robberName = "You";
    let victimName = "User";
    try {
      const userInfo = await api.getUserInfo([senderID, targetID]);
      robberName = userInfo[senderID]?.name || "You";
      victimName = userInfo[targetID]?.name || "User";
    } catch {}

    // ── 50/50 roll ──────────────────────────────────────────────────
    const success = Math.random() < 0.5;

    // ── FAILED: police fine ─────────────────────────────────────────
    if (!success) {
      const { bankData } = global.db;
      const walletBalance = robber.money || 0;

      let totalFine = 0;
      let walletTaken = 0;
      let bankTaken = 0;

      if (walletBalance > 0) {
        totalFine = Math.floor(walletBalance * 0.90);
        walletTaken = Math.min(walletBalance, totalFine);
        const remainder = totalFine - walletTaken;

        robber.money = walletBalance - walletTaken;
        await usersData.set(senderID, { ...robber, data: { ...robber.data } });

        if (remainder > 0) {
          try {
            const robberBankData = await bankData.get(senderID);
            if (robberBankData && robberBankData.userID) {
              bankTaken = Math.min(robberBankData.bankBalance || 0, remainder);
              robberBankData.bankBalance = (robberBankData.bankBalance || 0) - bankTaken;
              await bankData.set(senderID, robberBankData);
            }
          } catch {}
        }
      } else {
        try {
          const robberBankData = await bankData.get(senderID);
          if (robberBankData && robberBankData.userID) {
            totalFine = Math.floor((robberBankData.bankBalance || 0) * 0.90);
            bankTaken = Math.min(robberBankData.bankBalance || 0, totalFine);
            robberBankData.bankBalance = (robberBankData.bankBalance || 0) - bankTaken;
            await bankData.set(senderID, robberBankData);
          }
        } catch {}
      }

      let fineMsg =
          `🚔 𝗖𝗔𝗨𝗚𝗛𝗧 𝗕𝗬 𝗣𝗢𝗟𝗜𝗖𝗘!\n`
        + `━━━━━━━━━━━━━━━━━━━━━━\n`
        + `😂 You tried to rob ${victimName} and got caught!\n\n`
        + `💸 Total fine:   $${totalFine.toLocaleString()} (90%)\n`;

      if (walletTaken > 0) fineMsg += `👛 From wallet:  -$${walletTaken.toLocaleString()}\n`;
      if (bankTaken > 0) fineMsg += `🏦 From bank:    -$${bankTaken.toLocaleString()}\n`;
      if (walletTaken === 0 && bankTaken === 0) fineMsg += `😮 You had nothing — lucky break!\n`;

      fineMsg += `━━━━━━━━━━━━━━━━━━━━━━\n` + `💡 Attempts used: ${robber.data.robHistory.length}/2`;

      return message.reply(fineMsg);
    }

    // ── SUCCESS: steal 15–35% of victim's wallet ────────────────────
    const randomPercent = Math.floor(Math.random() * 21) + 15;
    const stolenAmount = Math.floor((victimMoney * randomPercent) / 100);

    robber.money = (robber.money || 0) + stolenAmount;
    victim.money = victimMoney - stolenAmount;

    await usersData.set(senderID, { ...robber, data: { ...robber.data } });
    await usersData.set(targetID, { ...victim, data: { ...victim.data } });

    message.reply(
        `✅ 𝗥𝗢𝗕𝗕𝗘𝗥𝗬 𝗦𝗨𝗖𝗖𝗘𝗦𝗦! 💰\n`
      + `━━━━━━━━━━━━━━━━━━━━━━\n`
      + `You swiped $${stolenAmount.toLocaleString()} from ${victimName}!\n`
      + `(${randomPercent}% of their wallet)\n`
      + `━━━━━━━━━━━━━━━━━━━━━━\n`
      + `💰 Your wallet: $${robber.money.toLocaleString()}\n`
      + `💡 Attempts used: ${robber.data.robHistory.length}/2`
    );

    api.sendMessage(
        `🚨 𝗬𝗢𝗨'𝗩𝗘 𝗕𝗘𝗘𝗡 𝗥𝗢𝗕𝗕𝗘𝗗!\n`
      + `━━━━━━━━━━━━━━━━━━━━━━\n`
      + `${robberName} just stole $${stolenAmount.toLocaleString()} from your wallet!`,
      targetID
    );
  }
};
