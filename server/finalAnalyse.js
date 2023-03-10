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
const userDetailsUrl = 'https://graph.facebook.com/v12.0/me?fields=id,name,location,friends.limit(10){id}&access_token=${accessToken}';
const userDetailsResponse = await axios.get(userDetailsUrl, {
httpsAgent: new https.Agent({
rejectUnauthorized: false
})
});

const { data: userDetails } = userDetailsResponse;

// Fetch user's posts
const postsUrl = 'https://graph.facebook.com/v12.0/me/posts?fields=id,message,created_time,type,comments.summary(true)&access_token=${accessToken}';
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
location: userDetails.location?.name || "",
friends_count: userDetails.friends.summary.total_count,
avgComments: 0
};

// Calculate average comments
let totalComments = 0;
let count = 0;
for (let post of posts.data) {
if (post.type === "status" && post.message && post.message.toLowerCase().includes("keyword")) {
totalComments += post.comments.summary.total_count;
count++;
}
}
userAuthModel.avgComments = count ? totalComments / count : 0;

// Update or insert userAuthModel document in the "user-auth-model" collection
const userAuthResult = await db.collection("user-auth-model").findOneAndUpdate(
{ id: userDetails.id },
{ $set: userAuthModel },
{ upsert: true }
);

console.log(userAuthResult);

// Store user insights in MongoDB
const userInsightsModel = {
userid: userDetails.id,
friends_count: userDetails.friends.summary.total_count,
location: userDetails.location?.name || "",
};

const userInsightsCollection = db.collection("UserInsightsFriends-Model");
const existingUserInsights = await userInsightsCollection.findOne({ userid: userDetails.id });

if (existingUserInsights) {
// Update existing user insights document
await userInsightsCollection.updateOne(
{ _id: existingUserInsights._id },
{ $set: {
friends_count: userInsightsModel.friends_count,
location: userInsightsModel.location,
}}
);
} else {
// Create new user insights document
await userInsightsCollection.insertOne(userInsightsModel);
}
// Store media insights in MongoDB
const mediaInsightsCollection = db.collection("MediaInsights-Model");
const existingMediaInsights = await mediaInsightsCollection.findOne({ userid: userDetails.id });

if (existingMediaInsights) {
// Update existing media insights document
await mediaInsightsCollection.updateOne(
{ _id: existingMediaInsights._id },
{ $set: {
likes: likes.data,
posts: posts.data.filter(post => post.type.toLowerCase() === 'photo' && post.message.toLowerCase().includes('keyword')),
avgComments: posts.data.filter(post => post.type.toLowerCase() === 'photo' && post.message.toLowerCase().includes('keyword'))
.reduce((total, post) => total + post.comments.summary.total_count, 0) / posts.data.filter(post => post.type.toLowerCase() === 'photo' && post.message.toLowerCase().includes('keyword')).length
}}
);
} else {
// Create new media insights document
const mediaInsightsModel = {
userid: userDetails.id,
likes: likes.data,
posts: posts.data.filter(post => post.type.toLowerCase() === 'photo' && post.message.toLowerCase().includes('keyword')),
avgComments: posts.data.filter(post => post.type.toLowerCase() === 'photo' && post.message.toLowerCase().includes('keyword'))
.reduce((total, post) => total + post.comments.summary.total_count, 0) / posts.data.filter(post => post.type.toLowerCase() === 'photo' && post.message.toLowerCase().includes('keyword')).length
};
await mediaInsightsCollection.insertOne(mediaInsightsModel);
}

res.send({ message: "Data stored successfully" });
});

app.listen(3000, () => {
console.log("Server listening on port 3000");
});





