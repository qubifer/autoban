const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const sqlite = require('sqlite');

const databaseFilename = './autoban.sqlite';

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
        try {
            const userId = interaction.options.getString('user_id');
            const reason = interaction.options.getString('reason');
            const currentDate = new Date().toISOString(); // Get the current date and time

            const db = await sqlite.open({
                filename: databaseFilename,
                driver: require('sqlite3').Database
            });
          
            await db.run('CREATE TABLE IF NOT EXISTS autoban (user_id TEXT PRIMARY KEY, reason TEXT, date TEXT)');

            const existingBan = await db.get('SELECT * FROM autoban WHERE user_id = ?', [userId]);

            if (existingBan) {
                await interaction.reply('This user is already banned.');
                return;
            }

            await db.run('INSERT INTO autoban (user_id, reason, date) VALUES (?, ?, ?)', [userId, reason, currentDate]);

            await db.close();
            
            await interaction.client.users.fetch(userId).then(user => {
                interaction.guild.bans.create(user, { reason: reason });
            }).catch(error => {
                console.error(`Error banning user: ${error}`);
            });
         
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
    },
};
