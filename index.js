const express = require('express');
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const app = express();
const PORT = process.env.PORT || 3000;
app.get('/', (req,res)=>res.send('Bot running'));
async function startBot(){
  const { state, saveCreds } = await useMultiFileAuthState('auth');
  const sock = makeWASocket({ auth: state, printQRInTerminal: false });
  sock.ev.on('creds.update', saveCreds);
  if(!sock.authState.creds.registered){
    const phoneNumber = '917283014424'; // <-- yahan apna WhatsApp number likho 91 ke sath
    const code = await sock.requestPairingCode(phoneNumber);
    console.log('PAIRING CODE: '+code);
  }
  sock.ev.on('connection.update', (u)=>{
    const { connection, lastDisconnect } = u;
    if(connection==='close'){
      const shouldReconnect = (lastDisconnect?.error instanceof Boom)?.output?.statusCode!== DisconnectReason.loggedOut;
      if(shouldReconnect) startBot();
    } else if(connection==='open'){ console.log('Bot Ready!'); }
  });
  sock.ev.on('messages.upsert', async ({messages})=>{
    const msg = messages[0];
    if(!msg.message || msg.key.fromMe) return;
    const text = msg.message.conversation || msg.message.extendedTextMessage?.text || '';
    if(text.toLowerCase()==='hi'){
      await sock.sendMessage(msg.key.remoteJid, { text: 'Hello! Bot online hai' });
    }
  });
}
startBot();
app.listen(PORT, ()=>console.log('Running'));
