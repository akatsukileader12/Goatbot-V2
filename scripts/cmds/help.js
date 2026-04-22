const fs = require("fs-extra");
const path = require("path");

module.exports = {
        config: {
                name: "help",
                aliases: ["menu", "commands", "cmds"],
                version: "5.0",
                author: "Charles MK",
                shortDescription: "Show all available commands",
                longDescription: "Displays a premium-styled categorized list of all bot commands with detailed information.",
                category: "system",
                guide: "{pn} - View all commands\n{pn} [command name] - View command details"
        },

        onStart: async function ({ message, args, prefix }) {
                const allCommands = global.GoatBot.commands;
                const categories = {};

                // Enhanced emoji mapping with better visuals
                const emojiMap = {
                        ai: "🤖", "ai-image": "🎨", group: "👥", system: "⚙️",
                        fun: "🎮", owner: "👑", config: "🔧", economy: "💰",
                        media: "📹", "18+": " 🔞", tools: "🛠️", utility: "⚡",
                        info: "ℹ️", image: "🖼️", game: "🎯", admin: "🛡️",
                        rank: "📊", boxchat: "💬", others: "📦"
                };

                const cleanCategoryName = (text) => {
                        if (!text) return "others";
                        return text
                                .normalize("NFKD")
                                .replace(/[^\w\s-]/g, "")
                                .replace(/\s+/g, " ")
                                .trim()
                                .toLowerCase();
                };

                // Categorize commands
                for (const [name, cmd] of allCommands) {
                        const cat = cleanCategoryName(cmd.config.category);
                        if (!categories[cat]) categories[cat] = [];
                        categories[cat].push(cmd.config.name);
                }

                // Show specific command details
                if (args[0]) {
                        const query = args[0].toLowerCase();
                        const cmd =
                                allCommands.get(query) ||
                                [...allCommands.values()].find((c) => (c.config.aliases || []).includes(query));

                        if (!cmd) {
                                return message.reply(
                                        `❌ 𝗖𝗢𝗠𝗠𝗔𝗡𝗗 𝗡𝗢𝗧 𝗙𝗢𝗨𝗡𝗗\n` +
                                        `━━━━━━━━━━━━━━━━━━\n\n` +
                                        `🔍 "${query}" 𝖽𝗈𝖾𝗌𝗇'𝗍 𝖾𝗑𝗂𝗌𝗍\n\n` +
                                        `💡 𝖴𝗌𝖾 ${prefix}help 𝗍𝗈 𝗌𝖾𝖾 𝖺𝗅𝗅 𝖼𝗈𝗆𝗆𝖺𝗇𝖽𝗌`
                                );
                        }

                        const {
                                name,
                                version,
                                author,
                                guide,
                                category,
                                shortDescription,
                                longDescription,
                                aliases,
                                role
                        } = cmd.config;

                        const desc =
                                typeof longDescription === "string"
                                        ? longDescription
                                        : longDescription?.en || shortDescription?.en || shortDescription || "No description available";

                        const usage =
                                typeof guide === "string"
                                        ? guide.replace(/{pn}/g, prefix)
                                        : guide?.en?.replace(/{pn}/g, prefix) || `${prefix}${name}`;

                        const requiredRole = cmd.config.role !== undefined ? cmd.config.role : 0;

                        // Role names mapping
                        const roleNames = {
                                0: "𝖴𝗌𝖾𝗋",
                                1: "𝖦𝗋𝗈𝗎𝗉 𝖠𝖽𝗆𝗂𝗇",
                                2: "𝖡𝗈𝗍 𝖠𝖽𝗆𝗂𝗇"
                        };

                        const categoryEmoji = emojiMap[cleanCategoryName(category)] || "📦";

                        return message.reply(
                                `${categoryEmoji} 𝗖𝗢𝗠𝗠𝗔𝗡𝗗 𝗜𝗡𝗙𝗢𝗥𝗠𝗔𝗧𝗜𝗢𝗡\n` +
                                `━━━━━━━━━━━━━━━━━━\n\n` +
                                `📌 𝗡𝗮𝗺𝗲: ${name}\n` +
                                `📂 𝗖𝗮𝘁𝗲𝗴𝗼𝗿𝘆: ${category || "Uncategorized"}\n` +
                                `📝 𝗗𝗲𝘀𝗰𝗿𝗶𝗽𝘁𝗶𝗼𝗻: ${desc}\n` +
                                `🔗 𝗔𝗹𝗶𝗮𝘀𝗲𝘀: ${aliases?.length ? aliases.join(", ") : "None"}\n` +
                                `💡 𝗨𝘀𝗮𝗴𝗲:\n   ${usage}\n` +
                                `🔐 𝗣𝗲𝗿𝗺𝗶𝘀𝘀𝗶𝗼𝗻: ${roleNames[requiredRole] || requiredRole}\n` +
                                `👨‍💻 𝗔𝘂𝘁𝗵𝗼𝗿: ${author}\n` +
                                `📊 𝗩𝗲𝗿𝘀𝗶𝗼𝗻: ${version}\n` +
                                `━━━━━━━━━━━━━━━━━━`
                        );
                }

                // Show all commands by category
                const formatCommands = (cmds) =>
                        cmds.sort().map((cmd) => `   ● ${cmd}`).join('\n');

                const totalCommands = [...allCommands.values()].length;

                let msg = `╔════════════════╗\n`;
                msg += `║             𝗠𝗞-𝗕𝗢𝗧             ║\n`;
                msg += `╚════════════════╝\n\n`;
                msg += `📊 𝗧𝗼𝘁𝗮𝗹 𝗖𝗼𝗺𝗺𝗮𝗻𝗱𝘀: ${totalCommands}\n`;
                msg += `⚡ 𝗣𝗿𝗲𝗳𝗶𝘅: ${prefix}\n`;
                msg += `━━━━━━━━━━━━━━━━━━\n\n`;

                const sortedCategories = Object.keys(categories).sort();

                for (const cat of sortedCategories) {
                        const emoji = emojiMap[cat] || "📦";

                        msg += `${emoji} 𝗖𝗔𝗧𝗘𝗚𝗢𝗥𝗬: ${cat.toUpperCase()}\n`;
                        msg += `━━━━━━━━━━━━━━━━━━\n`;
                        msg += `${formatCommands(categories[cat])}\n\n`;
                }

                msg += `━━━━━━━━━━━━━━━━━━\n`;
                msg += `💡 𝗛𝗢𝗪 𝗧𝗢 𝗨𝗦𝗘\n`;
                msg += `━━━━━━━━━━━━━━━━━━\n`;
                msg += `➥ ${prefix}help [command] - 𝖵𝗂𝖾𝗐 𝖽𝖾𝗍𝖺𝗂𝗅𝗌\n`;
                msg += `➥ ${prefix}callad - 𝖢𝗈𝗇𝗍𝖺𝖼𝗍 𝖺𝖽𝗆𝗂𝗇𝗌\n\n`;
                return message.reply(msg);
        }
};
