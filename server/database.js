const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const { MongoClient } = require("mongodb");
const axios = require("axios");

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

const client = await MongoClient.connect("mongodb://127.0.0.1:27017/", {
    useNewUrlParser: true,
  });
  const db = client.db("facebook");

app.post("/api/facebook", async (req, res) => {
  const data = req.body;
  const { accessToken } = data;

  // Connect to MongoDB


  // Store access token in MongoDB
  const resultAccessToken = await db
    .collection("MediaInsights-Model")
    .insertOne({ accessToken });

  console.log(resultAccessToken);

  // Fetch post details using access token
  const postApiUrl = `https://graph.facebook.com/v13.0/me/posts`;
  const fields = "id,message,created_time,type,comments.summary(true)";
  const postResponse = await axios.get(postApiUrl, {
    params: {
      access_token: accessToken,
      fields,
    },
  });

  // Store post details in MongoDB
  const posts = postResponse.data.data;
  const resultPosts = await db.collection("MediaInsights-Model").insertMany(posts);

  console.log(resultPosts);
  res.send({ message: "Data stored successfully" });
});

// app.post("/api/likes", async (req, res) => {
//     const data = req.body;
//     const { accessToken } = data;

  
//     // Store access token in MongoDB
//     const resultAccessToken = await db
//       .collection("MediaInsights-Model")
//       .insertOne({ accessToken });
//     console.log(resultAccessToken);
  
//     // Fetch user's likes details using Facebook Graph API
//     const likesResponse = await axios.get(
//       `https://graph.facebook.com/v12.0/me/likes?fields=id,name,category&access_token=${accessToken}`
//     );
  
//     // Store user's likes details in MongoDB
//     const likes = likesResponse.data.data;
//     const resultLikes = await db.collection("MediaInsights-Model").updateOne(
//       { accessToken },
//       {
//         $set: {
//           likes,
//         },
//       }
//     );
//     console.log(resultLikes);
  
//     res.send({ message: "Data stored successfully" });
//   });

app.listen(3000, () => {
  console.log("Server listening on port 3000");
});


