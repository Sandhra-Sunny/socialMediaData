const { MongoClient } = require("mongodb");

async function main() {
  try {
    // Connect to MongoDB
    const client = await MongoClient.connect("mongodb://127.0.0.1:27017/", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    const db = client.db("facebook");

    // Retrieve user insights from MongoDB
    const userInsightsCollection = db.collection("UserInsightsFriends-Model");
    const users = await userInsightsCollection.find().toArray();

    // Sort users by post type and average comments
    users.sort((a, b) => {
      // First, compare the post types
      const aPostTypes = a.posts ? a.posts.map((post) => post.type) : [];
      const bPostTypes = b.posts ? b.posts.map((post) => post.type) : [];
      const aMaxPostType = aPostTypes.reduce((max, type) => {
        return aPostTypes.filter((t) => t === type).length > aPostTypes.filter((t) => t === max).length ? type : max;
      }, "");
      const bMaxPostType = bPostTypes.reduce((max, type) => {
        return bPostTypes.filter((t) => t === type).length > bPostTypes.filter((t) => t === max).length ? type : max;
      }, "");
      if (aMaxPostType < bMaxPostType) {
        return -1;
      } else if (aMaxPostType > bMaxPostType) {
        return 1;
      }

      // If the post types are the same, compare the average comments
      const aAvgComments = a.avgComments || 0;
      const bAvgComments = b.avgComments || 0;
      if (aAvgComments > bAvgComments) {
        return -1;
      } else if (aAvgComments < bAvgComments) {
        return 1;
      }

      // If the average comments are the same, return 0
      return 0;
    });

    // Display the sorted users
    console.log(users);

    // Close the MongoDB connection
    await client.close();
  } catch (err) {
    console.error(err);
  }
}

main();

