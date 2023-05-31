import express, { Request, Response } from 'express';
import axios from 'axios';
import { WebClient } from '@slack/web-api';

const app = express();
const port = process.env.PORT || 8080;
const slackToken = "xoxb-338182487747-5330053957367-uMhNwVoOkqj29EuWfFsTS5uT";
const web = new WebClient(slackToken);

app.use(express.json());

interface Item {
  id : number;
  title : string;
  url : string;
  slug: string
}

interface Data {
  searchResults: Item[]
}

interface DataResponse {
  type: string;
  text: {
    type: string;
    text: string;
  };
}

app.post('/ask', async (req: Request, res: Response) => {
  try {
    const query = encodeURIComponent(req.body.text).replace(' ', '%20');
    const searchUrl = `https://help.trengo.com/en/search?term=${query}`;

    const { data }: { data: Data } = await axios.get(searchUrl);
    
    const { channel_id } = req.body;
    const response: DataResponse[] = data.searchResults.map((result) => ({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `<${result.url}|${result.title}>`,
      },
    }));
    console.log(channel_id, response)
    await web.chat.postMessage({
      channel: channel_id,
      text: 'Search Results:',
      blocks: response,
    });

    res.send('Search results sent to Slack.');
  } catch (error) {
    res.status(500).json({ error: 'Internal server error:'+ error });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
