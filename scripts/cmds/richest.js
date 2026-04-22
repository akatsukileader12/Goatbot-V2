module.exports = {
  config: {
    name: "richest",
    aliases: ["rich", "top", "leaderboard"],
    version: "2.0",
    author: "CharlesMK",
    countDown: 5,
    role: 0,
    description: {
      en: "Display the top 10 richest users"
    },
    category: "economy",
    guide: {
      en: "{pn}\nShows the top 10 richest users in the bot"
    }
  },

  onStart: async function ({ message, usersData, event, api }) {
    try {
      // 1. Send loading message first
      const loading = await message.reply("⏳ Loading top 10 wealthiest users...");
      const loadingID = loading.messageID;

      // 2. Get all users
      const allUsers = await usersData.getAll();

      const sorted = allUsers
        .filter(u => typeof u.money === "number")
        .sort((a, b) => b.money - a.money);

      const top10 = sorted.slice(0, 10);

      if (top10.length === 0) {
        return api.editMessage("❌ No users found with money data.", loadingID);
      }

      // 3. Build leaderboard
      let leaderboard = 
`╔════════════════╗
    💰 𝗧𝗢𝗣 𝟭𝟬 💰 
╚════════════════╝

`;

      for (let i = 0; i < top10.length; i++) {
        const user = top10[i];
        const rank = i + 1;

        let icon = "🔹";
        if (rank === 1) icon = "🥇";
        else if (rank === 2) icon = "🥈";
        else if (rank === 3) icon = "🥉";

        // Get user name
        let name = "Unknown User";
        try {
          const info = await api.getUserInfo(user.userID);
          name = info[user.userID]?.name || "Unknown User";
        } catch {}

        leaderboard += 
`${icon} 𝗥𝗔𝗡𝗞 #${rank}
👤 ${name}
💵 $${user.money.toLocaleString()}
───────────────────
`;
      }

      // 4. Find current user's rank
      const userIndex = sorted.findIndex(u => u.userID === event.senderID);

      if (userIndex !== -1) {
        const me = sorted[userIndex];

        leaderboard += 
`
╔═══ 𝗬𝗢𝗨𝗥 𝗥𝗔𝗡𝗞 ═══╗
 📍 #${userIndex + 1}
 💵 $${me.money.toLocaleString()}
╚════════════════╝`;
      }

      // 5. Edit loading message into final result
      return api.editMessage(leaderboard, loadingID);

    } catch (err) {
      console.error("Error in richest:", err);
      return message.reply("❌ An error occurred while loading leaderboard.");
    }
  }
};
