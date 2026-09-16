const express = require('express');
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const app = express();
const PORT = process.env.PORT || 3000;
app.get('/', (req,res)=>res.send('Bot running'));
let pairingSent = false;
async function startBot(){
  const { state, saveCreds } = await useMultiFileAuthState('auth');
  const { version } = await fetchLatestBaileysVersion();
  const sock = makeWASocket({ auth: state, version, printQRInTerminal: false });
  sock.ev.on('creds.update', saveCreds);
  sock.ev.on('connection.update', async (u)=>{
    const { connection, lastDisconnect } = u;
    if(!pairingSent &&!sock.authState.creds.registered){
      pairingSent = true;
      await new Promise(r=>setTimeout(r,3000));
      try{
        const phoneNumber = '917283014424';
        const code = await sock.requestPairingCode(phoneNumber);
        console.log('PAIRING CODE: '+code);
      }catch(e){ console.log('Pairing error', e.message); pairingSent=false; }
    }
    if(connection==='close'){
      const shouldReconnect = (lastDisconnect?.error instanceof Boom)?.output?.statusCode!== DisconnectReason.loggedOut;
      if(shouldReconnect) startBot();
    } else if(connection==='open'){ console.log('Bot Ready!'); }
  });
  sock.ev.on('messages.upsert', async ({messages})=>{
    const msg = messages[0];
    if(!msg.message || msg.key.fromMe) return;
    const jid = msg.key.remoteJid;
    const text = (msg.message.conversation || msg.message.extendedTextMessage?.text || '').toLowerCase().trim();
    const replies = {
      'hi': 'Hello! Main kya help kar sakta hu?',
      'hello': 'Hello! verything is ok na?',
      'kaise ho': 'Main badhiya hu! Aap batao, main kya help kar sakta hu?',
      'hello kaise ho': 'Hello! Main badhiya hu. Batao main kya help kar sakta hu?',
    };
    if(replies[text]){
      await sock.sendMessage(jid, { text: replies[text] });
    }
  });
}
startBot();
app.listen(PORT, ()=>console.log('Running'));
