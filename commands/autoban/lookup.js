const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const mysql = require('mysql');
const databaseConfig = require("../../config");


module.exports = {
    data: new SlashCommandBuilder()
        .setName('lookup')
        .setDescription('Lookup the banned user')
        .addStringOption(option =>
            option.setName('user_id')
                .setDescription('Enter the user ID')
                .setRequired(true)
        ),

    async execute(interaction) {
        try {
            const userId = interaction.options.getString('user_id');

            const connection = mysql.createConnection(databaseConfig);
            connection.connect();

            const query = 'SELECT * FROM autoban WHERE user_id = ?';
            const [banInfo] = await new Promise((resolve, reject) => {
                connection.query(query, [userId], (error, results) => {
                    if (error) reject(error);
                    else resolve(results);
                });
            });

            connection.end();

            if (!banInfo) {
                await interaction.reply('This user is not banned.');
                return;
            }

            const user = await interaction.client.users.fetch(userId);

            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('Auto Blacklist Information')
                .setDescription(`**User:** ${user.username} (${userId}) is auto blacklisted.  \n \n **Reason:** ${banInfo.reason} \n **Date:** ${banInfo.date}`)
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Error processing lookup command:', error);
            await interaction.reply(`There was an error processing your command: ${error}`);
        }
    },
};
