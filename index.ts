import express from 'express'
import faunadb, { query } from 'faunadb'
import cors from 'cors'

const app = express()
const PORT = process.env.PORT ?? 5000

const client = new faunadb.Client({ secret: process.env.DB_LOGIN_KEY ?? '' })
const { Call, Function, Map, Paginate, Match, Index, Lambda, Get, Select } = query

app.use(express.json())
app.use(cors())

app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    const token = await client.query(
      Call(Function('login_user'), { email, password })
    )

    return res.status(200).send(token)
  } catch (error) {
    return res.status(404).send(error)
  }
})

app.get('/', async (req, res) => {
  const { authorization } = req.headers
  if (!authorization) {
    return res.sendStatus(404)
  }

  const { 1: token } = (authorization as string | '').split('Bearer ')

  const client = new faunadb.Client({ secret: token })
  try {
    const data = await client.query(
      Map(
        Paginate(Match(Index('allTodos'))),
        Lambda(x => Select('title', Select('data', Get(x))))
      )
    )

    return res.send(data)
  } catch (error) {
    return res.status(400).send(error)
  }
})

app.listen(PORT, () => console.log(`Server at ${PORT}`))