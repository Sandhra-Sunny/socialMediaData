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

  // Fetch user information
  const userInfoUrl = `https://graph.facebook.com/me?fields=id,friends,age_range,gender,location&access_token=${accessToken}`;
  const userInfoResponse = await axios.get(userInfoUrl);
  const userInfo = userInfoResponse.data;

  // Store access token and user information in MongoDB
  const result = await db.collection("UserInsightsFriends-Model").insertOne({
    accessToken,
    id: userInfo.id,
    friends: userInfo.friends,
    age_range: userInfo.age_range,
    gender: userInfo.gender,
    location: userInfo.location,
  });

  console.log(result);
  res.send({ message: "Data stored successfully" });
});

app.listen(3000, () => {
  console.log("Server listening on port 3000");
});
