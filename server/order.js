const { MongoClient } = require("mongodb");

async function main() {
  try {
    // Connect to MongoDB
    const client = await MongoClient.connect("mongodb://127.0.0.1:27017/", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    const db = client.db("facebook");

    // Retrieve user details from MongoDB
    const userAuthCollection = db.collection("user-auth-model");
    const users = await userAuthCollection.find().toArray();

    // Sort users by average comments in descending order
    users.sort((a, b) => {
      const aAvgComments = a.avgComments || 0;
      const bAvgComments = b.avgComments || 0;
      if (aAvgComments > bAvgComments) {
        return -1;
      } else if (aAvgComments < bAvgComments) {
        return 1;
      }
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

