const express = require('express');
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const qrcode = require('qrcode-terminal');
const app = express();
const PORT = process.env.PORT || 3000;
app.get('/', (req,res)=>res.send('Bot is running'));
async function startBot(){
const { state, saveCreds } = await useMultiFileAuthState('auth');
const sock = makeWASocket({ auth: state, printQRInTerminal: true });
sock.ev.on('creds.update', saveCreds);
sock.ev.on('connection.update', (u)=>{
const { connection, lastDisconnect, qr } = u;
if(qr){ qrcode.generate(qr,{small:true}); }
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
