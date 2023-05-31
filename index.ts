import express, { Request, Response } from 'express';
import axios from 'axios';
import { WebClient } from '@slack/web-api';
import bodyParser from 'body-parser';

const app = express();
const port = process.env.PORT || 8080;
const web = new WebClient(process.env.SLACK_TOKEN);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
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
    console.log(req.body, response)
    // await web.chat.postMessage({
    //   channel: channel_id,
    //   text: 'Search Results:',
    //   blocks: response,
    // });

    res.send({ blocks: response });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error:'+ error });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
