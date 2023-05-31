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
    text: string;
    value: string;
}

const options: { text: string; value: string }[] = [];

app.post('/ask', async (req: Request, res: Response) => {
  try {
    const query = encodeURIComponent(req.body.text).replace(' ', '%20');
    const searchUrl = `https://help.trengo.com/en/search?term=${query}`;

    const { data }: { data: Data } = await axios.get(searchUrl);
    
    const { channel_id } = req.body;
    // const response: DataResponse[] = data.searchResults.map((result) => ({
    //   type: 'section',
    //   text: {
    //     type: 'mrkdwn',
    //     text: `<${result.url}|${result.title}>`,
    //   },
    // }));
    options.length = 0;
    data.searchResults.forEach((result) => {
      const option = { text: result.title, value: result.url };
      options.push(option);
    });

    const message = {
      channel: req.body.channel_id,
      text: 'Please select an item:',
      attachments: [
        {
          text: 'Choose an item from the dropdown menu:',
          fallback: 'You are unable to choose an item',
          callback_id: 'item_selection',
          color: '#3AA3E3',
          attachment_type: 'default',
          actions: [
            {
              name: 'item_selection',
              type: 'select',
              options: options,
            },
          ],
        },
      ],
    };

    res.send(message);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error:'+ error });
  }
});

app.post('/interact', async (req: Request, res: Response) => {
  try {
    const payload = JSON.parse(req.body.payload);
    const selectedValue = payload.actions[0].selected_options[0].value;

    const selectedOption = options.find((option) => option.value === selectedValue);

    console.log(selectedOption, req.body.payload);
    const response = {
      channel: '',
      text: '',
    };

    if (selectedOption) {
      const responseMessage = `This Help center article might help you: <${selectedOption.value}|${selectedOption.text}>`;
      response.channel = payload.channel.id
      response.text = responseMessage
    } 
    else { 
      const responseMessage = `Something went wrong in the THC bot`;
      response.channel = payload.channel.id
      response.text = responseMessage
    }

    res.send(response);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
