import cron from 'cron'
import { Client, Events, GatewayIntentBits } from 'discord.js'
import dotenv from 'dotenv'
import { gql, request } from 'graphql-request'
import path from 'path'
const __dirname = path.resolve()

dotenv.config({ path: __dirname + '/.env' })

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent,
  ],
})

const query = gql`
  query {
    project(id: "5c27de44-6f1d-4895-bb90-9e0de4225532") {
      progress
    }
  }
`

client.login(process.env.DISCORD_TOKEN)

client.once(Events.ClientReady, c => {
  console.log(`Ready! Logged in as ${c.user.tag}`)
})

client.once('ready', async client => {
  const linear = await request('https://api.linear.app/graphql', query, undefined, {
    Authorization: process.env.LINEAR_TOKEN,
  })
  const projectProgressInPercentage = Math.floor(linear.project.progress * 100)

  client.channels.cache
    .get('859265030809583636')
    .send(
      `Olá senhores. Gostaria de me apresentar, me chamo **Jarvis** e eu sou o mais novo ajudante aqui no servidor. Eu fui criado com o intuito de ajuda-lós a alcançar os seus objetivos, que não são pequenos.`
    )
  client.channels.cache
    .get('859265030809583636')
    .send(
      `No momento precisamos finalizar a Versão 1 do projeto da Becca, então nada melhor que uma ajuda não é?`
    )
  client.channels.cache
    .get('859265030809583636')
    .send(
      `Todos os dias eu comunicarei o nosso progresso do projeto para incentiva-lós a produzirem mais!`
    )
  client.channels.cache
    .get('859265030809583636')
    .send(`Ah, com exceção dos finais de semanas claro, você precisam descansar também.`)
  client.channels.cache
    .get('859265030809583636')
    .send(
      `(ou não, mas meu programa diz para não distrai-lós nesses dias, eu não sei porque colocaram essas regras tolas, mas está no meu código fonte, eu não posso fazer nada.)`
    )
  client.channels.cache
    .get('859265030809583636')
    .send(
      `Mas eu não vim aqui para reclamar, eu vim para avisa-lós que atualmente o projeto da Becca está **${projectProgressInPercentage}%** concluído!`
    )
  client.channels.cache
    .get('859265030809583636')
    .send(`Por favor, aumentem essa porcentagem. Conto com vocês! 💙`)

  let scheduledMessage = new cron.CronJob({
    cronTime: '0 10 * * 1-5',
    timeZone: 'America/Sao_Paulo',
    onTick: async () => {
      const linear = await request('https://api.linear.app/graphql', query, undefined, {
        Authorization: process.env.LINEAR_TOKEN,
      })
      const projectProgressInPercentage = Math.floor(linear.project.progress * 100)

      const message = `Bom dia, senhores. Atualmente o projeto da Becca está **${projectProgressInPercentage}%** concluído!`
      client.channels.cache.get('957362163750670336').send(message)
    },
  })

  scheduledMessage.start()
})
