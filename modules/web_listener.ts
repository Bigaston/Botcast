let debug = require("debug")("botcast:web")
const express = require('express')
const app = express()

app.use(express.json())

app.get('/', (req: any, res: any) => {
  res.send('Hello World!')
})

app.listen(process.env.PORT || 6969, () => {
  debug("Serveur lancé sur le port" + process.env.PORT || 6969)
})