const { time } = require('console');
const { Client, GatewayIntentBits, Guild } = require('discord.js');
const { readFileSync } = require('fs');
const { botToken, serverId, message, exceptions } = JSON.parse(readFileSync('./config.json'));

// Create a new client instance
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers] });

// Login to Discord with your client's token
client.login(botToken)
    .then(() => {
        console.log('Logged in on bot user successfully')
        client.guilds.fetch().then(guilds => {
            const guild = guilds.get(serverId);
            if (guild) {
                guild.fetch().then(guild => {
                    messageAllMembers(guild);
                })
                return;
            }
            console.log('Doesn\'t seem like the bot is a member on the server you set in config.json?');
        }).catch((reason) => {
            console.log(`Unable to get list of servers the bot is a member in:\n${reason}`);
        });
    })
    .catch(reason => {
        console.log(`Unable to log in bot user! Wrong token perhaps? Error message:\n${reason}`);
    });

// Function to message all members in a given guild.
function messageAllMembers(guild) {
    guild.members.fetch()
    .then(members => { 
        const messagePromises = [];
        let exceptionsUsed = 0;

        console.log(`Sending messages... You have ${members.size} members, so expect this to take ${members.size/60} minutes.`);

        members.forEach(member => {
            if (!exceptions.includes(member.id) && member.id != guild.id && member.id != client.user.id) {
                const promise = member.send(message)
                messagePromises.push(promise);
            } else if(member.id != guild.id && member.id != client.user.id) {
                exceptionsUsed++;
            }
        });

        Promise.allSettled(messagePromises).then(values => {
            let sentMessages = 0;
            let failedMessages = 0;

            for (const value of values) {
                if (value.status === 'fulfilled') {
                    sentMessages++;
                    continue;
                }
                failedMessages++;
            }
            
            console.log(`\nNote that you can't send messages to people that disallow DMs from others that share a server.\n\nSuccessfully sent ${sentMessages} messages, ${failedMessages} messages failed and ${exceptionsUsed} messages weren't sent due to your exceptions.`);
        });
    }).catch(reason => {
        console.log(`Unable to get discord server members: ${reason}`);
    });
}
