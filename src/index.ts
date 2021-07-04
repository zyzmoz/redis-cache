import express from 'express';
import fetch from 'node-fetch';
import redis from 'redis';

const PORT = process.env.PORT || 8080;
const PORT_REDIS = process.env.PORT_REDIS? parseInt(process.env.PORT_REDIS) : 6379;


const app = express();
const redisClient = redis.createClient(PORT_REDIS);


const getGithubUser = async (req: any, res: any, next: any) => {
  const { username } = req.params;
  try {
    console.log("Fetching data...")
    const response = await fetch(`https://api.github.com/users/${username}`);    
    const data = await response.json();
    redisClient.setex(username, 3600, JSON.stringify(data));
    res.send(data);
  } catch (err) {
    console.error(err);
    res.status(500)
  }

}

const cacheMiddleware = (req: any, res: any, next: any) => {
  const { username } = req.params;
  redisClient.get(username, (err, data) => {
    if (err) throw err;

    if (data !== null) {
      res.send(JSON.parse(data));
    } else {
      next();
    }
  });
}

app.get(`/users/:username`, cacheMiddleware, getGithubUser);


app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});