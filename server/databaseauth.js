const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const axios = require('axios');
const { MongoClient } = require('mongodb');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

app.post('/api/facebook', async (req, res) => {
  const data = req.body;
  const { accessToken } = data;

  // Connect to MongoDB
  const client = await MongoClient.connect('mongodb://127.0.0.1:27017/', { useNewUrlParser: true });
  const db = client.db('facebook');

  // Store access token in MongoDB
  const resultAccessToken = await db.collection('user-auth-model').insertOne({ accessToken });

  // Use access token to fetch user details from Facebook Graph API
  const facebookApiUrl = `https://graph.facebook.com/v11.0/me?fields=id,name,birthday&access_token=${accessToken}`;
  const response = await axios.get(facebookApiUrl);

  // Extract user details from response
  const { id, name, birthday } = response.data;

  // Store user details in MongoDB
  const resultUserDetails = await db.collection('user-auth-model').insertOne({ id, name, birthday });

  console.log(resultAccessToken);
  console.log(resultUserDetails);
  res.send({ message: 'Data stored successfully' });
});

app.listen(3000, () => {
  console.log('Server listening on port 3000');
});
