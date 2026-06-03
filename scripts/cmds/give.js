module.exports = {
  config: {
    name: "transfer",
    aliases: ["pay", "send", "give"],
    version: "1.0",
    author: "CharlesMK",
    countDown: 5,
    role: 0,
    description: "Transfer money to another user (max $100,000 per transfer)",
    category: "economy",
    guide: {
      en: "{pn} @mention <amount>\n{pn} <uid> <amount>\n\nExample: {pn} @John 50000\n\n💸 Max transfer: $100,000"
    }
  },

  onStart: async function ({ args, message, event, usersData, api }) {
    const { senderID, mentions, messageReply } = event;

    const MAX_TRANSFER = 100000;

    // ── Resolve target ────────────────────────────────────────────
    let targetID = null;
    let amount = null;

    if (messageReply) {
      targetID = messageReply.senderID;
      amount = parseInt(args[0]);
    } else if (Object.keys(mentions).length > 0) {
      targetID = Object.keys(mentions)[0];
      amount = parseInt(args[1]);
    } else if (args[0] && /^\d{10,}$/.test(args[0])) {
      targetID = args[0];
      amount = parseInt(args[1]);
    }

    if (!targetID || isNaN(amount) || amount <= 0) {
      return message.reply(
        `❌ 𝗜𝗡𝗩𝗔𝗟𝗜𝗗 𝗨𝗦𝗔𝗚𝗘\n\n` +
        `Usage:\n` +
        `• +transfer @mention <amount>\n` +
        `• +transfer <uid> <amount>\n` +
        `• Reply to a message + +transfer <amount>\n\n` +
        `💸 Max per transfer: $${MAX_TRANSFER.toLocaleString()}`
      );
    }

    if (targetID === senderID) {
      return message.reply(`❌ You can't transfer money to yourself.`);
    }

    // ── Transfer cap ──────────────────────────────────────────────
    if (amount > MAX_TRANSFER) {
      return message.reply(
        `🚫 𝗧𝗥𝗔𝗡𝗦𝗙𝗘𝗥 𝗟𝗜𝗠𝗜𝗧 𝗘𝗫𝗖𝗘𝗘𝗗𝗘𝗗\n\n` +
        `Maximum transfer amount is $${MAX_TRANSFER.toLocaleString()} per transaction.\n` +
        `💡 Use +bank to store large amounts safely.`
      );
    }

    // ── Balance check ─────────────────────────────────────────────
    const senderData = await usersData.get(senderID);
    const senderBalance = senderData.money || 0;

    if (senderBalance < amount) {
      return message.reply(
        `❌ 𝗜𝗡𝗦𝗨𝗙𝗙𝗜𝗖𝗜𝗘𝗡𝗧 𝗙𝗨𝗡𝗗𝗦\n\n` +
        `💰 Your balance: $${senderBalance.toLocaleString()}\n` +
        `💸 Transfer amount: $${amount.toLocaleString()}`
      );
    }

    // ── Get target info ───────────────────────────────────────────
    const targetData = await usersData.get(targetID);
    let targetName = targetData.name || "User";

    // ── Execute transfer ──────────────────────────────────────────
    await usersData.set(senderID, {
      ...senderData,
      money: senderBalance - amount
    });

    await usersData.set(targetID, {
      ...targetData,
      money: (targetData.money || 0) + amount
    });

    return message.reply(
      `✅ 𝗧𝗥𝗔𝗡𝗦𝗙𝗘𝗥 𝗦𝗨𝗖𝗖𝗘𝗦𝗦𝗙𝗨𝗟\n` +
      `━━━━━━━━━━━━━━━━━━\n\n` +
      `👤 To: ${targetName}\n` +
      `💸 Amount: $${amount.toLocaleString()}\n\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `💰 Your balance: $${(senderBalance - amount).toLocaleString()}`
    );
  }
};
