const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const { MongoClient } = require("mongodb");
const axios = require("axios");

app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

app.post("/api/facebook", async (req, res) => {
  const data = req.body;
  const { accessToken } = data;

  // Connect to MongoDB
  const client = await MongoClient.connect("mongodb://127.0.0.1:27017/", {
    useNewUrlParser: true,
  });
  const db = client.db("facebook");

  // Store access token in MongoDB
  const resultAccessToken = await db
    .collection("MediaInsights-Model")
    .insertOne({ accessToken });
  console.log(resultAccessToken);

  // Fetch user's likes details using Facebook Graph API
  const likesResponse = await axios.get(
    `https://graph.facebook.com/v12.0/me/likes?fields=id,name,category&access_token=${accessToken}`
  );

  // Store user's likes details in MongoDB
  const likes = likesResponse.data.data;
  const resultLikes = await db.collection("MediaInsights-Model").updateOne(
    { accessToken },
    {
      $set: {
        likes,
      },
    }
  );
  console.log(resultLikes);

  res.send({ message: "Data stored successfully" });
});

app.listen(3000, () => {
  console.log("Server listening on port 3000");
});
