const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const https = require('https');
const http = require('http');
const axios = require('axios');

const app = express();
app.use(bodyParser.json());

// Path to self-signed certificate and key
const privateKey = fs.readFileSync('/root/AmanoDev/ssl/selfsigned.key', 'utf8');
const certificate = fs.readFileSync('/root/AmanoDev/ssl/selfsigned.crt', 'utf8');
const credentials = { key: privateKey, cert: certificate };

// Storage for commands
let commands = { esp1: [], esp2: [], esp3: [] };

const getRelayState = () => {
  return {
    esp1: Array(16).fill('off'),
    esp2: Array(5).fill('off'),
    esp3: Array(18).fill('off')
  };
};

let relayState = getRelayState();

app.post('/relay', async (req, res) => {
  try {
    const { action, floor, table } = req.body;
    if (typeof action !== 'string' || (action !== 'on' && action !== 'off') ||
        typeof floor !== 'number' || floor < 1 || floor > 2 ||
        typeof table !== 'string' || !/^0[0-9]{2}$/.test(table)) {
      return res.status(400).send('Invalid parameters');
    }

    let esp;
    const tableNumber = parseInt(table, 10) - 1;
    if (floor === 1) {
      if (tableNumber >= 0 && tableNumber < 16) {
        esp = 'esp1';
      } else if (tableNumber >= 16 && tableNumber < 21) {
        esp = 'esp2';
      } else {
        return res.status(400).send('Table number out of range for floor 1');
      }
    } else if (floor === 2 && tableNumber >= 0 && tableNumber < 18) {
      esp = 'esp3';
    } else {
      return res.status(400).send('Table number out of range for floor 2');
    }

    if (relayState[esp][tableNumber] === action) {
      return res.status(200).send(`Relay ${table} on floor ${floor} is already ${action}`);
    }

    commands[esp].push({ action, table: tableNumber });
    relayState[esp][tableNumber] = action;

    console.log(`Command for table ${table} on floor ${floor} has been queued`);
    res.send(`Command for table ${table} on floor ${floor} has been queued`);
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).send('Server error');
  }
});

app.get('/poll/:esp', (req, res) => {
  try {
    const esp = req.params.esp;
    if (!commands[esp]) {
      return res.status(400).send('Invalid ESP32 identifier');
    }

    const commandList = commands[esp];
    commands[esp] = [];
    res.json(commandList);
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).send('Server error');
  }
});

const PORT = process.env.PORT || 3000;
const HTTP_PORT = 80;

// HTTP to HTTPS redirection
http.createServer((req, res) => {
  res.writeHead(301, { "Location": "https://" + req.headers['host'] + req.url });
  res.end();
}).listen(HTTP_PORT, () => {
  console.log(`HTTP server running on port ${HTTP_PORT} and redirecting to HTTPS`);
});

https.createServer(credentials, app).listen(PORT, () => {
  console.log(`HTTPS server running on port ${PORT}`);
});
