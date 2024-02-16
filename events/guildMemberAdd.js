const { Client, Intents } = require('discord.js');
const sqlite = require('sqlite');


const databaseFilename = '../dautoban.sqlite';
module.exports = {
    name: 'guildMemberAdd',
    async execute(member) {
        try {
 
            const db = await sqlite.open({
                filename: databaseFilename,
                driver: require('sqlite3').Database
            });

            const bannedUser = await db.get('SELECT * FROM autoban WHERE user_id = ?', [member.id]);
    
            if (bannedUser) {
       
                await member.ban({ reason: `Auto-banned: ${bannedUser.reason}` });
    
                console.log(`User ${member.user.tag} (${member.id}) was auto-banned from guild ${member.guild.name}.`);

                await db.close();
                return;
            }
    
      
            await db.close();
        } catch (error) {
            console.error('Error banning user:', error);
        }
    }}    