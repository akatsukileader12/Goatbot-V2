module.exports = {
  config: {
    name: "reseteconomy",
    aliases: ["wipemoney", "wipebank"],
    version: "1.1",
    author: "CharlesMK",
    countDown: 0,
    role: 2,
    description: "Set all users wallet and bank balance to $0",
    category: "admin",
    guide: {
      en: "{pn} confirm — Executes the reset"
    }
  },

  onStart: async function ({ message, args, usersData }) {
    const confirmed = args[0]?.toLowerCase() === "confirm";

    if (!confirmed) {
      return message.reply(
        "⚠️ 𝗪𝗔𝗥𝗡𝗜𝗡𝗚\n" +
        "━━━━━━━━━━━━━━━━━━\n\n" +
        "This will set EVERY user\'s wallet and bank to $0.\n" +
        "All other data (exp, mining, inventory) will be kept.\n\n" +
        "Type +reseteconomy confirm to proceed."
      );
    }

    await message.reply("🔄 𝗥𝗘𝗦𝗘𝗧 𝗦𝗧𝗔𝗥𝗧𝗘𝗗\nThis runs in the background. You will get a summary when done.");

    // Run async in background so it doesn't block/timeout
    (async () => {
      try {
        const allUsers = await usersData.getAll();
        let done = 0;
        let failed = 0;

        // Process in batches of 10 with a small delay between batches
        // to avoid overwhelming the DB connection
        const BATCH = 10;
        for (let i = 0; i < allUsers.length; i += BATCH) {
          const batch = allUsers.slice(i, i + BATCH);
          await Promise.allSettled(
            batch.map(async (user) => {
              if (!user || !user.userID) return;
              try {
                const data = user.data || {};
                if (data.bankdata) {
                  data.bankdata.bank = 0;
                  data.bankdata.loan = 0;
                }
                await usersData.set(user.userID, {
                  ...user,
                  money: 0,
                  data
                });
                done++;
              } catch (_) {
                failed++;
              }
            })
          );
          // Small breathing room between batches
          await new Promise(r => setTimeout(r, 50));
        }

        await message.reply(
          "✅ 𝗥𝗘𝗦𝗘𝗧 𝗖𝗢𝗠𝗣𝗟𝗘𝗧𝗘\n" +
          "━━━━━━━━━━━━━━━━━━\n\n" +
          "💸 Wallet → $0\n" +
          "🏦 Bank → $0\n" +
          "💳 Loans → $0\n\n" +
          `✅ Reset: ${done} user(s)\n` +
          (failed > 0 ? `❌ Failed: ${failed} user(s)` : "All succeeded!")
        );
      } catch (err) {
        await message.reply("❌ Reset failed: " + err.message);
      }
    })();
  }
};
