// Import the required MongoDB modules
const { MongoClient } = require('mongodb');

const mongoose = require('mongoose');
const express = require('express');
const bodyParser = require('body-parser');
const axios = require("axios");
const https = require('https');
const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept"
    );
    next();
});

const url = 'mongodb://127.0.0.1:27017/';

const client = new MongoClient(url);
client.connect(url, { useNewUrlParser: true });
const dbName = 'facebook';

app.post('/api/posts', async (req, res) => {
  const selectedItem = req.body.data;

    const collection = client.db(dbName).collection('MediaInsights-Model');
    const userCollection = client.db(dbName).collection('user-auth-model');

    const facebookData = await collection.find({ posts: { $elemMatch: { message: { $regex: selectedItem, $options: 'i' } } } }).toArray();

    let results = [];
    let users = [];
    await Promise.all(facebookData?.map(async (d) => {
      // console.log(d)
      if(d.userid){
          users.push(d.userid)
      }
      //console.log("hi",users)
      await userCollection.find({ id: {"$in": users }}).toArray(function(err, docs) {
          if (err) {
          // console.log(`Error searching for users: ${err}`);
          return res.status(500).send('Error searching for users');
          }
          
      }).then(async (userResultData) => {
          // console.log("userResultData: ", userResultData)
          await userResultData?.map((userMapdata) => {
          // console.log("userResultData: ", userMapdata, userMapdata)

              results.push({
                  id: userMapdata?._id,
                  authID: userMapdata?.id,
                  name: userMapdata?.name
              });
          })
        }) 
    }))
       
    res.send(results);
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
    // const client = await mongoose.connect("mongodb://127.0.0.1:27017/", {
    //   useNewUrlParser: true,
    //   useUnifiedTopology: true,
    // });

    const userCollection = client.db(dbName).collection('user-auth-model');
    const userInsightsCollection = client.db(dbName).collection('UserInsightsFriends-Model'); 
  
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
    
    // Update or insert userAuthModel document in the "user-auth-model" collection
    const userAuthResult = await userCollection.findOneAndUpdate(
      { id: userDetails.id },
      { $set: userAuthModel },
      { upsert: true }
    );
  
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
        

        const existingUserInsights = await userInsightsCollection.findOne({ userid: userDetails.id });
        
        if (existingUserInsights) {
        // Update existing user insights document
        await userInsightsCollection.updateOne(
        { _id: existingUserInsights._id },
        { $set: {
        friends: userInsightsModel.friends,
        location: userInsightsModel.location,
        age_range: userInsightsModel.age_range,
        }}
        );
        } else {
        // Create new user insights document
        await userInsightsCollection.insertOne(userInsightsModel);
        }
        
        // Store media insights in MongoDB
        const mediaInsightsCollection = client.db(dbName).collection("MediaInsights-Model");
        const existingMediaInsights = await mediaInsightsCollection.findOne({ userid: userDetails.id });
        
        if (existingMediaInsights) {
        // Update existing media insights document
        await mediaInsightsCollection.updateOne(
        { _id: existingMediaInsights._id },
        { $set: {
        likes: likes.data,
        posts: posts.data,
        }}
        );
        } else {
        // Create new media insights document
        const mediaInsightsModel = {
        userid: userDetails.id,
        likes: likes.data,
        posts: posts.data,
        };
        await mediaInsightsCollection.insertOne(mediaInsightsModel);
        }
        
        res.send({ message: "Data stored successfully" });
});

// Store the media and media insights in the database
app.post('/api/facebook-data', async (req, res) => {
  try {

    const mediaSchema = new mongoose.Schema({
      id: String,
      username: String,
      caption: String,
      media_type: String,
      media_url: String,
      thumbnail_url: String,
      permalink: String,
      followers_count: Number,
    });
    
    const mediaInsightsSchema = new mongoose.Schema({
      impressions: Number,
      reach: Number,
      profile_views: Number,
    });
    
    // Define the models for the media and media insights
    const mediaCollection = client.db(dbName).collection('user-auth-model');
    const mediaInsightCollection = client.db(dbName).collection('media');
    // const Media = mongoose.model('Media', mediaSchema);
    // const MediaInsights = mongoose.model('MediaInsights', mediaInsightsSchema);

    const { instagramBusinessAccount, media, mediaInsights } = req.body;

    const existingMediaUrls = await mediaCollection.findOne({ id: instagramBusinessAccount.id });

    if(!existingMediaUrls){
      await mediaCollection.insertOne({
        id: instagramBusinessAccount.id, 
        followers_count: instagramBusinessAccount.followers_count,
        name:instagramBusinessAccount.username,
      })
    } 

    let mediaUserFound = await mediaInsightCollection.findOne({ userId: instagramBusinessAccount.id });
    if(mediaUserFound){
      await mediaInsightCollection.updateOne({
        userId: instagramBusinessAccount.id, 
      }, {mediaData: media, mediaInsights: mediaInsights})
    }else{
      await mediaInsightCollection.insertOne({
        userId: instagramBusinessAccount.id, 
        mediaData: media,
        mediaInsights: mediaInsights
      })
    }

    // Check if the user is already logged in
    // Media.create({id, media_type: "cad"})
    // const existingMediaUrls = await Media.find({ id }, { media_url: 1, _id: 0 }).distinct('media_url');
    // const newMedia = media.filter(m => !existingMediaUrls.includes(m.media_url));
    // if (newMedia.length > 0) {
    //   // Create new media documents for each new piece of media
    //   const mediaDocs = newMedia.map(m => new Media({ ...m, id }));
    //   await Media.insertMany(mediaDocs);
    //   console.log(`${mediaDocs.length} new media documents created`);
    // } else {
    //   console.log('No new media documents to create');
    // }
    // Update the media insights document
    // const updatedMediaInsights = await MediaInsights.updateOne({ id }, { $set: mediaInsights });
    // if (updatedMediaInsights.nModified === 1) {
    //   console.log('Media insights document updated successfully');
    // } else {
    //   console.log('No media insights document to update');
    // }
    res.status(200).json({ message: 'Data stored/updated successfully' });
  } catch (error) {
    console.error('Failed to store/update data:', error);
    res.status(500).json({ error: 'Failed to store/update data' });
  }
});

app.post('/api/instaData', async (req, res) => {
  const selectedItem = req.body.data;

  console.log(selectedItem)

    // const db = connection.db(dbName);
    const instaMediaCollection = client.db(dbName).collection('media');
    const facebookMediaCollection = client.db(dbName).collection('MediaInsights-Model');
    const userCollection = client.db(dbName).collection('user-auth-model');

    let instaDataCollection = await instaMediaCollection.find({ mediaData:{ $elemMatch: { caption: { $regex: selectedItem, $options: 'i' } } }}).toArray()
    
    let facebookDataCollection = await facebookMediaCollection.find({ posts: { $elemMatch: { message: { $regex: selectedItem, $options: 'i' } } } }).toArray()

    console.log(instaDataCollection)
    let results = [];
    let users = [];
    await Promise.all(facebookDataCollection?.map(async (d) => {
      // console.log(d)
      if(d.userid){
          users.push(d.userid)
      }
      //console.log("hi",users)
      await userCollection.find({ id: {"$in": users }}).toArray(function(err, docs) {
          if (err) {
          // console.log(`Error searching for users: ${err}`);
          return res.status(500).send('Error searching for users');
          }
          
      }).then(async (userResultData) => {
          // console.log("userResultData: ", userResultData)
          await userResultData?.map((userMapdata) => {
          // console.log("userResultData: ", userMapdata, userMapdata)

              results.push({
                  id: userMapdata?.id,
                  authID: userMapdata?._id,
                  name: userMapdata?.name
              });
          })
        }) 
    }))

    await Promise.all(instaDataCollection?.map(async (d) => {
      // console.log(d)
      if(d.userId){
          users.push(d.userId)
      }

      users = [...new Set(users)];
      console.log("hi",users)
      await userCollection.find({ id: {"$in": users }}).toArray(function(err, docs) {
          if (err) {
          // console.log(`Error searching for users: ${err}`);
          return res.status(500).send('Error searching for users');
          }
          
      }).then(async (userResultData) => {
          // console.log("userResultData: ", userResultData)
          await userResultData?.map((userMapdata) => {
          // console.log("userResultData: ", userMapdata, userMapdata)

              results.push({
                  id: userMapdata?.id,
                  authID: userMapdata?._id,
                  name: userMapdata?.name
              });
          })
        }) 
    }))

    console.log(results)

    res.send(results);

    // console.log(instaDataCollection, facebookDataCollection);
      // .toArray(function(err, docs) {
      //   if (err) {
      //     console.log(`Error searching for posts: ${err}`);
      //     return;
      //   }
      //   console.log(docs);
      //   // Loop through the matching posts and print their IDs and captions
      //   docs.forEach(function(doc) {
      //     console.log(`Post ${doc._id} contains the keyword "${selectedItem}" in the caption.`);
      //     console.log(`Caption: ${doc.caption}`);
      //   });
      // })
      // .then((result) => {
      //   console.log(result);
      //   
      // })
      // .catch((err) => {
      //   console.log(`Error connecting to MongoDB: ${err}`);
      // });
  // });
});


// Start the server
app.listen(3000, () => {
  console.log('Server listening on port 3000');
});
