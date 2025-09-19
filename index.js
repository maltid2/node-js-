const express = require('express');
const { IgApiClient } = require('instagram-private-api');
require('dotenv').config();

const app = express();
app.use(express.json()); // Pour pouvoir lire JSON dans le body

const username = process.env.INSTAGRAM_USERNAME;
const password = process.env.INSTAGRAM_PASSWORD;

app.post('/api/v1/accounts/login', async (req, res) => {
  const ig = new IgApiClient();
  try {
    ig.state.generateDevice(username);
    await ig.account.login(username, password);
    res.json({ status: 'success', message: 'Connecté à Instagram' });
  } catch (error) {
    res.status(400).json({ status: 'error', error: error.message });
  }
});

// Ta route existante GET /messages etc.

app.get('/messages', async (req, res) => {
  const ig = new IgApiClient();
  try {
    ig.state.generateDevice(username);
    await ig.account.login(username, password);

    const inbox = ig.feed.directInbox();
    const threads = await inbox.items();

    const newMessages = [];

    for (const thread of threads.slice(0, 3)) {
      const messages = await thread.getItems();

      for (const message of messages.slice(0, 2)) {
        if (
          message.item_type === 'text' &&
          message.user_id.toString() !== ig.state.cookieUserId.toString() &&
          message.timestamp > Date.now() - 120000
        ) {
          newMessages.push({
            threadId: thread.thread_id,
            userId: message.user_id,
            username: message.user?.username || 'user',
            messageText: message.text,
            timestamp: message.timestamp,
          });
        }
      }
    }

    res.json(newMessages);
  } catch (error) {
    res.status(500).json({ status: 'error', error: error.message });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`API listening on port ${port}`);
});
