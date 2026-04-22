module.exports = {
  config: {
    name: "daily",
    aliases: ["dailyclaim"],
    version: "1.1.0",
    author: "CharlesMK",
    countDown: 3,
    role: 0,
    description: "Claim daily rewards",
    category: "economy",
    guide: {
      en: "{pn} - Claim daily money reward"
    }
  },

  onStart: async function ({ message, event, usersData }) {
    const { senderID } = event;
    const user = await usersData.get(senderID);

    if (!user.data) user.data = {};
    if (!user.data.daily) {
      user.data.daily = { lastClaim: 0, streak: 0 };
    }

    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    const timeSinceLastClaim = now - user.data.daily.lastClaim;

    if (timeSinceLastClaim < dayMs) {
      const timeLeft = dayMs - timeSinceLastClaim;
      const hoursLeft = Math.floor(timeLeft / (60 * 60 * 1000));
      const minsLeft  = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000));
      return message.reply(
        `⏰ 𝗔𝗟𝗥𝗘𝗔𝗗𝗬 𝗖𝗟𝗔𝗜𝗠𝗘𝗗\n\n` +
        `You already claimed your daily reward!\n` +
        `Come back in: ${hoursLeft}h ${minsLeft}m`
      );
    }

    // Update streak
    if (timeSinceLastClaim < 2 * dayMs) {
      user.data.daily.streak += 1;
    } else {
      user.data.daily.streak = 1;
    }

    const streak      = user.data.daily.streak;
    const baseReward  = 2000;
    const streakBonus = Math.min(streak * 500, 10000);
    const totalReward = baseReward + streakBonus;

    user.money = (user.money || 0) + totalReward;
    user.data.daily.lastClaim = now;

    await usersData.set(senderID, user);

    return message.reply(
      `🎁 𝗗𝗔𝗜𝗟𝗬 𝗥𝗘𝗪𝗔𝗥𝗗 𝗖𝗟𝗔𝗜𝗠𝗘𝗗!\n\n` +
      `💰 Reward: $${totalReward.toLocaleString()}\n` +
      `🔥 Streak: ${streak} day${streak > 1 ? "s" : ""}\n` +
      `🎯 Streak Bonus: $${streakBonus.toLocaleString()}`
    );
  }
};
