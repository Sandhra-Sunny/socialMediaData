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
  const { accessToken } = req.body;

  // Fetch user details
  const userDetailsUrl = `https://graph.facebook.com/v12.0/me?fields=id,name,birthday,gender,location,friends.limit(10){id,name,age_range,gender}&access_token=${accessToken}`;
  const userDetailsResponse = await axios.get(userDetailsUrl);

  const { data: userDetails } = userDetailsResponse;

  // Fetch user's likes
  const likesUrl = `https://graph.facebook.com/v12.0/me/likes?fields=id,name,category&access_token=${accessToken}`;
  const likesResponse = await axios.get(likesUrl);

  const { data: likes } = likesResponse;

  // Fetch user's posts
  const postsUrl = `https://graph.facebook.com/v12.0/me/posts?fields=id,message,created_time&access_token=${accessToken}`;
  const postsResponse = await axios.get(postsUrl);

  const { data: posts } = postsResponse;

  // Format user's friend data
  const friends = {
    count: userDetails.friends.summary.total_count,
    data: userDetails.friends.data.map((friend) => {
      return { id: friend.id, name: friend.name };
    }),
  };

  // Connect to MongoDB
  const client = await MongoClient.connect("mongodb://127.0.0.1:27017/", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  const db = client.db("facebook");

  // Store user details in MongoDB
  const userDetailsResult = await db.collection("user_datas").insertOne({
    id: userDetails.id,
    name: userDetails.name,
    birthday: userDetails.birthday,
    gender: userDetails.gender,
    location: userDetails.location,
    friends: friends,
  });

  console.log(userDetailsResult);

  // Store likes in MongoDB
  const likesResult = await db.collection("likes").insertMany(likes.data);

  console.log(likesResult);

  // Store posts in MongoDB
  const postsResult = await db.collection("posts").insertMany(posts.data);

  console.log(postsResult);

  res.send({ message: "Data stored successfully" });
});

app.listen(3000, () => {
  console.log("Server listening on port 3000");
});
