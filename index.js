const express = require('express');
const { IgApiClient } = require('instagram-private-api');
const app = express();
const port = process.env.PORT || 3000;

app.get('/messages', async (req, res) => {
  const ig = new IgApiClient();
  try {
    ig.state.generateDevice(process.env.INSTAGRAM_USERNAME);
    await ig.account.login(process.env.INSTAGRAM_USERNAME, process.env.INSTAGRAM_PASSWORD);

    const inbox = ig.feed.directInbox();
    const threads = await inbox.items();

    const newMessages = [];

    for (const thread of threads.slice(0, 3)) {
      const messages = await thread.getItems();

      for (const message of messages.slice(0, 2)) {
        if (message.item_type === 'text' &&
            message.user_id.toString() !== ig.state.cookieUserId.toString() &&
            message.timestamp > (Date.now() - 120000)) {

          newMessages.push({
            threadId: thread.thread_id,
            userId: message.user_id,
            username: message.user?.username || 'user',
            messageText: message.text,
            timestamp: message.timestamp
          });
        }
      }
    }

    res.json(newMessages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`API listening on port ${port}`);
});
