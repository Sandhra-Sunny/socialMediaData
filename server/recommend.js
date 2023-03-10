// Import the required MongoDB modules
const { MongoClient } = require('mongodb');
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
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


// Define the MongoDB connection URL and database name
const url = 'mongodb://127.0.0.1:27017/';
const dbName = 'facebook';

// Define a function to check if a keyword is present in a post message
function keywordMatch(post, keyword) {
  // Convert the post message to lowercase to make the search case-insensitive
  const message = post?.message?.toLowerCase();
  
  // Use the includes() method to check if the keyword is present in the message
  if (message?.includes(keyword?.toLowerCase())) {
    return true;
  } else {
    return false;
  }
}

// Connect to the MongoDB database and search for posts containing a keyword
const keyword = 'Flower';

app.post("/getData", (req, res) => {
  console.log("inside DAtas", req.body)
})
MongoClient.connect(url, { useNewUrlParser: true })
.then((connection) => {
      const db = connection.db(dbName);
      const collection = db.collection('MediaInsights-Model');

     
      // Search for posts containing the keyword in the message field
      collection.find( { posts: { $elemMatch: { message: { $regex: keyword, $options: 'i' } } } }).toArray(function(err, docs) {
        if (err) {
          console.log(`Error searching for posts: ${err}`);
          return;
        }
        console.log(docs)
      }).then((result) => {
         // Loop through the matching posts and print their IDs and messages
         result.forEach(function(doc) {
      const posts = doc.posts;
      posts.forEach(function(post) {
        if (keywordMatch(post, keyword)) {
          console.log(`Post ${post.id} in document ${doc._id} contains the keyword "${keyword}".`);
          console.log(`Message: ${post.message}`);
        }
      });
    });
        console.log(result)
      })
});

app.listen(3000, () => {
  console.log('Server listening on port 3000');
});






















  

