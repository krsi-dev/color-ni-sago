require('dotenv').config()
const colornisago = require('./modules')
const { Client, GatewayIntentBits } = require('discord.js')
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]})

client.on('ready', () => console.log('Color Ni Sago: Ready'))
client.on('messageCreate', client => colornisago(client))
client.login(process.env.DISCORD_TOKEN)