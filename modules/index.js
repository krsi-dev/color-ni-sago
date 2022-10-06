const _ = require('lodash')
const axios = require('axios')
const comma = require('comma-number')
const { utils } = require('web3')
const { parse } = require('discord-command-parser')
const { EmbedBuilder } = require('discord.js')

const devmode = false
const devid = process.env.DEV_ID
const prefix = devmode ? 'dev' : 'color'
const devapi = axios.create({baseURL: process.env.API})
const colors = ['red', 'green', 'blue', 'white', 'yellow', 'pink']
const emoji = { green: '🟩', red: '🟥', blue: '🟦', pink: '🟪', white: '⬜', yellow: '🟨'}

function embed (client) {
    const imageURl = 'https://i.postimg.cc/brC2ms6x/CNS-200-100-px.gif'
    const embed = new EmbedBuilder()
    embed.setTimestamp()
    embed.setColor(0xAEC6CF)
    embed.setImage(imageURl)
    embed.setAuthor({  
        name: client.author.username,
        iconURL: `https://cdn.discordapp.com/avatars/${client.author.id}/${client.author.avatar}.png?size=256`,
        url: 'https://www.buymeacoffee.com/sagoslife'
    })

    return embed
}

function description (client, content) {
    return client.channel.send({embeds: [embed(client)
        .setDescription(content)
    ]})
}

async function main (client) {
    if (devmode && client.author.id !== devid) return;
    const parsed = parse(client, '.')
    if (!parsed.success) return;

    const options = parsed.arguments
    const command = parsed.command
    const commandSub = options[0]
    if (!command) return;
    if (command !== prefix) return;

    
    // .color [0xa]
    if (utils.isAddress(commandSub)) return link(client, options)

    if (commandSub) {
        // .color deposit
        if (commandSub === 'topup') return topup(client, options)

        if (commandSub === 'buy') return buy(client, options)
        
        // .color withdraw
        if (commandSub === 'withdraw') return withdraw(client, options)    
        
        // .color red [more colors]
        if (colors.find(color => 
            commandSub.toLowerCase() === color ||
            commandSub.toLowerCase()[0] === color[0]
        )) return color(client, options)
    }
    

    // .color
    return profile(client, options)
}

async function profile (client, options) {
    return devapi.get('/user', {params: {discordid: client.author.id}})
        .then(response => description(client, response.data))
}

async function link (client, options) {
    return devapi.post('/user', {address: options[0], discordid: client.author.id})
        .then(response => description(client, response.data))
}

async function topup (client, options) {
    const topup = await devapi.get('/topup')
        .then(response => response.data)
    await description(client, topup.content)
    return client.channel.send(topup.address)
}

async function buy (client, options) {
    return devapi.get('/buy', {params: {discordid: client.author.id}})
        .then(response => description(client, response.data))
        
}

async function withdraw (client, options) {
    return devapi.get('/withdraw', {params: {discordid: client.author.id}})
    .then(response => description(client, response.data))
}

async function color(client, options) {
    const user = await devapi.get('/user/json', {params: {discordid: client.author.id}})
        .then(response => response.data)
        .catch(err => {sago: 0})

    const winningColors =  [
        _.takeRight(_.shuffle(colors)),
        _.take(_.shuffle(colors)),
        _.takeRight(_.shuffle(colors))
    ].flatMap(i => i)
    
    const selectedColors = _.uniq(
        options.map(sc => colors.find(color => 
            sc.toLowerCase() === color ||
            sc.toLowerCase()[0] === color[0]
        ))
    )

    
    const one = await devapi.get('/token/one').then(response => response.data)
    const bet = selectedColors.length * one
    
    
    const won = one * winningColors.map(c => selectedColors.includes(c)).filter(i => i).length
    const lose = one * selectedColors.map(c => !winningColors.includes(c)).filter(i => i).length

    if (!user.sago || bet > user.sago) {
        return description( client,
            `${winningColors.map(w => emoji[w])}\n\n` +
            `**Won:** ${comma(won.toFixed(0))} \`SAGO\`\n` +
            `**Lose:** ${comma(lose.toFixed(0))} \`SAGO\`\n` +            
            'Not enough balance to credit.\n'
        )
    } else {
        if (won) await devapi.post('/user/sago/add', {amount: won, discordid: client.author.id})
        if (lose) await devapi.post('/user/sago/deduct', {amount: lose, discordid: client.author.id})
        return description( client,
            `${winningColors.map(w => emoji[w])}\n\n` +
            `**Won:** ${comma(won.toFixed(0))} \`SAGO\`\n` +
            `**Lose:** ${comma(lose.toFixed(0))} \`SAGO\`\n` +            
            'Balance updated.\n'
        )
    }
}

module.exports = main