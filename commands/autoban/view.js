const { SlashCommandBuilder } = require('@discordjs/builders');
const { ActionRowBuilder, ButtonBuilder, EmbedBuilder } = require('discord.js');
const mysql = require('mysql');

const databaseConfig = require("../../config");


module.exports = {
    data: new SlashCommandBuilder()
        .setName('view')
        .setDescription('Lookup all the blacklisted users')
        .addStringOption(option =>
            option.setName('page')
                .setDescription('Enter the page number')
                .setRequired(false)
        ),

    async execute(interaction) {
        try {
            const page = interaction.options.getInteger('page') || 1;
            const usersPerPage = 5;
            const startFrom = (page - 1) * usersPerPage;

            const connection = mysql.createConnection(databaseConfig);
            connection.connect();

            const query = 'SELECT * FROM autoban LIMIT ? OFFSET ?';
            const banInfos = await new Promise((resolve, reject) => {
                connection.query(query, [usersPerPage, startFrom], (error, results) => {
                    if (error) reject(error);
                    else resolve(results);
                });
            });

            connection.end();

            if (banInfos.length === 0) {
                await interaction.reply('No banned users found.');
                return;
            }

            const view = new EmbedBuilder()
                .setTitle('Banned Users')
                .setDescription(`Page ${page}`)
                .setColor('#FF0000');

            for (const banInfo of banInfos) {
                const user = await interaction.client.users.fetch(banInfo.user_id);
                view.addFields(
                    { name: '**User**', value: `${user.tag}`},
                    { name: '**Blacklisted for:**', value: `${banInfo.reason}` },
                    { name: '**Date:**', value: `${banInfo.date}}` }
                );
            }

            const previousButton = new ButtonBuilder()
                .setCustomId('previous')
                .setLabel('Previous')
                .setStyle('1');

            const nextButton = new ButtonBuilder()
                .setCustomId('next')
                .setLabel('Next')
                .setStyle('1');

            const row = new ActionRowBuilder().addComponents(previousButton, nextButton);

            await interaction.reply({ embeds: [view], components: [row] });

        } catch (error) {
            console.error('Error viewing banned users:', error);
            await interaction.reply('There was an error while processing your request.');
        }
    },
};
