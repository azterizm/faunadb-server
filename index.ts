import express from 'express'
import faunadb, { query } from 'faunadb'
import cors from 'cors'
import passport from 'passport'
import { Strategy as BearerStrategy } from 'passport-http-bearer'

require('dotenv/config')
const app = express()
const PORT = process.env.PORT ?? 5000
let client = new faunadb.Client({ secret: process.env.DB_LOGIN_KEY ?? '' })
const { Create, Collection, CurrentIdentity, Call, Function, Map, Paginate, Match, Index, Lambda, Get, Select } = query

passport.use(new BearerStrategy(async (token, done) => {
  client = new faunadb.Client({ secret: token })
  try {
    const user = await client.query(
      Select('data', Get(CurrentIdentity()))
    )
    return done(null, user)
  } catch (err) {
    return done(err)
  }
}))

app.use(express.json())
app.use(cors())
app.use(passport.initialize())

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

app.post('/add', async (req, res) => {
  try {
    const { title } = req.body
    await client.query(
      Create(Collection('Todo'), {
        data: {
          title,
          completed: false,
          user: CurrentIdentity()
        }
      })
    )

    res.sendStatus(200)
  } catch (error) {
    return res.status(400).send(error)
  }
})

app.get('/', passport.authenticate('bearer', { session: false  }), async (req, res) => {
  console.log(req.user)
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
