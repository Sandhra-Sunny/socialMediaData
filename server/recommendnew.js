// Import the required MongoDB modules
const { MongoClient } = require('mongodb');

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

// Connect to the MongoDB database and search for posts containing the selected item
const selectedItem = 'Restaurant'; // assume the selected item is "Fashion"
MongoClient.connect(url, { useNewUrlParser: true })
.then((connection) => {
const db = connection.db(dbName);
const collection = db.collection('MediaInsights-Model');
// Search for posts containing the selected item in the message field
collection.find({ posts: { $elemMatch: { message: { $regex: selectedItem, $options: 'i' } } } })
  .toArray(function(err, docs) {
    if (err) {
      console.log(`Error searching for posts: ${err}`);
      return;
    }
    console.log(docs);
    // Loop through the matching posts and print their IDs and messages
    docs.forEach(function(doc) {
      const posts = doc.posts;
      posts.forEach(function(post) {
        if (keywordMatch(post, selectedItem)) {
          console.log(`Post ${post.id} in document ${doc._id} contains the keyword "${selectedItem}".`);
          console.log(`Message: ${post.message}`);
        }
      });
    });
  })
  .then((result) => {
    console.log(result);
    connection.close();
  })
  .catch((err) => {
    console.log(`Error connecting to MongoDB: ${err}`);
  });
});