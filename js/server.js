const express = require('express')
const app = express()
const path = require('path');

app.use(express.static(__dirname + '/img'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (request, response) => {
  response.sendFile(path.join(__dirname, '/index.html'))
})

app.post('/info', (request, response) => {
  response.send(request.body);
})

const PORT = 8000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
