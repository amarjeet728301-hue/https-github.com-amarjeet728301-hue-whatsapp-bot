const express = require('express');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req,res)=>res.send('Bot is running'));

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: { args: ['--no-sandbox', '--disable-setuid-sandbox'] }
});

client.on('qr', qr => {
  console.log('QR RECEIVED');
  qrcode.generate(qr, {small: true});
});

client.on('ready', () => console.log('WhatsApp Bot Ready!'));

client.on('message', async msg => {
  if(msg.body.toLowerCase() === 'hi') {
    msg.reply('Hello! Bot online hai');
  }
});

client.initialize();

app.listen(PORT, ()=>console.log('Running on '+PORT));
