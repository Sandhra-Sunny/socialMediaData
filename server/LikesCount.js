const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const { MongoClient } = require("mongodb");
const axios = require("axios");
const https = require('https');
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
  const userDetailsUrl = `https://graph.facebook.com/v12.0/me?fields=id,name,birthday,gender,age_range,location,friends.limit(10){id,name,age_range,gender}&access_token=${accessToken}`;
  const userDetailsResponse = await axios.get(userDetailsUrl, {
    httpsAgent: new https.Agent({  
      rejectUnauthorized: false
    })
  });

  const { data: userDetails } = userDetailsResponse;

  // Fetch user's likes
  const likesUrl = `https://graph.facebook.com/v12.0/me/likes?fields=id,name,category&access_token=${accessToken}`;
  const likesResponse = await axios.get(likesUrl, {
    httpsAgent: new https.Agent({  
      rejectUnauthorized: false
    })
  });

  const { data: likes } = likesResponse;

  // Fetch user's posts
  const postsUrl = `https://graph.facebook.com/v12.0/me/posts?fields=id,message,created_time,type,comments.summary(true)&access_token=${accessToken}`;
  const postsResponse = await axios.get(postsUrl, {
    httpsAgent: new https.Agent({  
      rejectUnauthorized: false
    })
  });

  const { data: posts } = postsResponse;

  // Connect to MongoDB
  const client = await MongoClient.connect("mongodb://127.0.0.1:27017/", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  const db = client.db("facebook");

  // Store user details in MongoDB
const userAuthModel = {
    id: userDetails.id,
    name: userDetails.name,
    birthday: userDetails.birthday,
    avgLikes: 0,
    avgComments: 0
  };
  
  // Calculate average likes and comments
  
  let totalComments = 0;
  
  for (let post of posts.data) {
    
    totalComments += post.comments.summary.total_count;
  }
  
  
  userAuthModel.avgComments = totalComments / posts.data.length;
  
  const userAuthResult = await db.collection("user-auth-model").insertOne(userAuthModel);
  
  console.log(userAuthResult);
  

  // Store user insights in MongoDB
  const userInsightsModel = {
    userid: userDetails.id,
    friends: {
      count: userDetails.friends.summary.total_count,
      data: userDetails.friends.data.map((friend) => ({
        id: friend.id,
        name: friend.name,
        age_range: friend.age_range,
        gender: userDetails.gender,
      })),
    },
    location: userDetails.location?.name || "",
    age_range: userDetails.age_range?.min || "",
  };

  const userInsightsResult = await db
    .collection("UserInsightsFriends-Model")
    .insertOne(userInsightsModel);

  console.log(userInsightsResult);

  // Store media insights in MongoDB
  
  const mediaInsightsModel = {
    userid: userDetails.id,
    likes: likes.data,
    posts: posts.data,
  };

  const mediaInsightsResult = await db
    .collection("MediaInsights-Model")
    .insertOne(mediaInsightsModel);

  console.log(mediaInsightsResult);

  res.send({ message: "Data stored successfully" });
});

app.listen(3000, () => {
  console.log("Server listening on port 3000");
});


  



