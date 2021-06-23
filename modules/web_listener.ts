let debug = require('debug')('botcast:web');
const express = require('express');
const app = express();

app.use(express.json());

app.post('/', (req: any, res: any) => {
  console.log(req.body);

  if (req.body.type === 1) {
    res.json({ type: 1 });
  }
});

app.listen(process.env.PORT || 6969, () => {
  debug('Serveur lancé sur le port' + (process.env.PORT || 6969));
});
