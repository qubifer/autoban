const { Client, Intents } = require('discord.js');
const mysql = require('mysql');
const databaseConfig = require("../config");

module.exports = {
    name: 'guildMemberAdd',
    async execute(member) {
        try {
            const connection = mysql.createConnection(databaseConfig);
            connection.connect();

            const query = 'SELECT * FROM autoban WHERE user_id = ?';
            const [bannedUser] = await new Promise((resolve, reject) => {
                connection.query(query, [member.id], (error, results) => {
                    if (error) reject(error);
                    else resolve(results);
                });
            });

            if (bannedUser) {
                await member.ban({ reason: `Auto-Blacklisted: ${bannedUser.reason}` });
                console.log(`User ${member.user.tag} (${member.id}) was banned (Auto Blacklisted) from guild ${member.guild.name}.`);
                connection.end();
                return;
            }

            connection.end();
        } catch (error) {
            console.error('Error banning user:', error);
        }
    },
};
