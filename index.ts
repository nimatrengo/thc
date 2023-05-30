import express, { Request, Response } from 'express';
import axios from 'axios';
import cheerio from 'cheerio';

const app = express();
const port = 8080;

interface Item {
  id : number;
  title : string;
  url : string;
  slug: string
}

interface Data {
  searchResults: Item[]
}

app.get('/ask/:query', async (req: Request, res: Response) => {
  try {
    const query = encodeURIComponent(req.params.query).replace(' ', '%20');
    const searchUrl = `https://help.trengo.com/en/search?term=${query}`;

    const { data }: { data: Data }= await axios.get(searchUrl);

    res.json(data.searchResults);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
