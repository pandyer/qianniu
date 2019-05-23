const express = require('express');
const nativeProvider = require('./nativeProvider');
const ipcNative = new nativeProvider.IPCNative;

const app = express();
app.use(express.json());
app.get('/ipc/native', (req, res) => {
  res.json({
    status: ipcNative.started ? 'online' : 'offline',
    clients: ipcNative.listClients()
  })
})
app.post('ipc/assistants/:assistantID/messages', async (req, res) => {
  const assistantID = req.params.assistantID;
  const { buyerNick, sentences } = req.body;
  const resp = await ipcNative.sendSentences(assistantID, buyerNick, sentences);
  res.json(resp);
}