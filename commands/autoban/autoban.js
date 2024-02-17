const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const mysql = require('mysql');
const config = require("../../config");
const databaseConfig = require("../../config");


module.exports = {
    data: new SlashCommandBuilder()
        .setName('autoban')
        .setDescription('Autobans the user')
        .addStringOption(option =>
            option.setName('user_id')
                .setDescription('Enter the user ID')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Enter the reason for the ban')
                .setRequired(true)
        ),

    async execute(interaction) {
        if (interaction.user.id === config.ownerId) {
            try {
                const userId = interaction.options.getString('user_id');
                const reason = interaction.options.getString('reason');
                const currentDate = new Date().toISOString().slice(0, 19).replace('T', ' '); // Correctly format the date

                const connection = mysql.createConnection(databaseConfig);
                connection.connect();

                const createTableQuery = `CREATE TABLE IF NOT EXISTS autoban (
                    user_id VARCHAR(255) PRIMARY KEY,
                    reason TEXT,
                    date TIMESTAMP
                )`;

                await new Promise((resolve, reject) => {
                    connection.query(createTableQuery, (error) => {
                        if (error) reject(error);
                        else resolve();
                    });
                });

                const checkBanQuery = 'SELECT * FROM autoban WHERE user_id = ?';
                const [existingBan] = await new Promise((resolve, reject) => {
                    connection.query(checkBanQuery, [userId], (error, results) => {
                        if (error) reject(error);
                        else resolve(results);
                    });
                });

                if (existingBan) {
                    await interaction.reply('This user is already banned.');
                    connection.end();
                    return;
                }

                const insertBanQuery = 'INSERT INTO autoban (user_id, reason, date) VALUES (?, ?, ?)';
                await new Promise((resolve, reject) => {
                    connection.query(insertBanQuery, [userId, reason, currentDate], (error) => {
                        if (error) reject(error);
                        else resolve();
                    });
                });

                connection.end();
                
                const embed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('User Auto Blacklist')
                    .setDescription(`User ${userId} has been globally banned. \n Reason: ${reason} \n Date: ${currentDate}`)
                    .setTimestamp();

                await interaction.reply({ embeds: [embed] });
            } catch (error) {
                console.error('Error processing autoban command:', error);
                await interaction.reply(`There was an error processing your command: ${error}`);
            }
        } else {
            await interaction.reply('You do not have permission to use this command.'); 
        }
    },
};
