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

const lastWeekTasksQuery = gql`
  query LastWeekTasksQuery {
    issues(
      filter: {
        updatedAt: { gt: "-P1W" }
        state: { type: { in: ["started", "completed"] } }
        project: { id: { eq: "5c27de44-6f1d-4895-bb90-9e0de4225532" } }
      }
    ) {
      nodes {
        title
        updatedAt
        estimate
        identifier
        assignee {
          name
        }
        state {
          type
          name
        }
      }
    }
  }
`

function getDate(ISOString) {
  return new Date(ISOString)
    .toLocaleDateString('pt-BR', {
      month: '2-digit',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    })
    .replace(' ', ' às ')
}

client.login(process.env.DISCORD_TOKEN)

client.once(Events.ClientReady, c => {
  console.log(`Ready! Logged in as ${c.user.tag}`)
})

const LINEAR_BASE_URL = 'https://api.linear.app/graphql'
const headers = {
  Authorization: process.env.LINEAR_TOKEN,
}

client.once('ready', async client => {
  const channel = client.channels.cache.get('957362163750670336')

  let scheduledMessage = new cron.CronJob({
    cronTime: '0 10 * * 1-5',
    timeZone: 'America/Sao_Paulo',
    onTick: async () => {
      const linear = await request(LINEAR_BASE_URL, query, undefined, headers)
      const projectProgressInPercentage = Math.floor(linear.project.progress * 100)

      const message = `Bom dia, senhores. Atualmente o projeto da Becca está **${projectProgressInPercentage}%** concluído!`
      channel.send(message)
    },
  })

  let scheduledMessage2 = new cron.CronJob({
    cronTime: '0 10 * * 3',
    timeZone: 'America/Sao_Paulo',
    onTick: async () => {
      const linear = await request(
        LINEAR_BASE_URL,
        lastWeekTasksQuery,
        undefined,
        headers
      )

      const issuesPerAssignee = linear.issues.nodes.reduce((total, current) => {
        return {
          ...total,
          [current.assignee.name]: [...(total[current.assignee.name] ?? []), current],
        }
      }, {})

      const mappedIssuesPerAssignee = Object.entries(issuesPerAssignee)

      channel.send(
        `@everyone Bom dia, Senhores.\n\nHoje é dia de atualização!\n\nTrouxe uma ajuda para relembrar vocês do que foi feito durante os últimos **7** dias:`
      )

      const textToSend = mappedIssuesPerAssignee.reduce((total, [assignee, issues]) => {
        const formattedIssues = issues.reduce((total, issue) => {
          const emotes = {
            Done: ':purple_circle:',
            'In Review': ':blue_circle:',
            'In Progress': ':yellow_circle:',
            Handoff: ':green_circle:',
          }

          return (
            total +
            `\n  - [${issue.estimate}] ${issue.title} *#${issue.identifier}* (**${getDate(
              issue.updatedAt
            )}**) ${emotes[issue.state.name]}`
          )
        }, '')

        return total + `\n\n> **${assignee}** (${issues.length}):${formattedIssues}`
      }, '')

      channel.send(textToSend)
    },
  })

  scheduledMessage.start()
  scheduledMessage2.start()
})
