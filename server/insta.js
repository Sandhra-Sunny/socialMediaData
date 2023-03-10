const MongoClient = require('mongodb').MongoClient;
const axios = require('axios');

const url = 'mongodb://127.0.0.1:27017/';
const apiUrl = 'https://graph.facebook.com/17841457263619759/insights?metric=impressions,reach,profile_views&period=day&access_token=EAAZA97EZC3iW4BAIu4C7XZAnk1xpcuolNPNNZAWvX3OrjDhM5W4yEiNZB57PiWIwGxKeplxlSSxfnTuGV73WiH07Bx2nrvb6ETZBalJYoYzIy2J0EnTprtxH2ZAygNZBeiL9MZAaWD3o26r7vrfQoImGZBTbdurggMWfs2UFHRwwZCyQmHjGKrZAxMzZC';

axios.get(apiUrl)
.then(response => {
const data = response.data.data;
console.log(data);
// Extract only the required data (name, period, value)
const requiredData = data.map(item => {
    const filteredValues = item.values.filter(value => value.name === 'impressions' || value.name === 'reach' || value.name === 'profile_views');
    return {
      name: item.name,
      period: item.period,
      values: filteredValues.map(value => {
        return {
          value: value.value,
        };
      })
    };
  });
  
  // Connect to MongoDB and insert data
  MongoClient.connect(url, { useNewUrlParser: true }, (err, client) => {
    if (err) throw err;
  
    const db = client.db('instagram');
    const insightsCollection = db.collection('insights');
  
    insightsCollection.insertMany(requiredData, (err, result) => {
      if (err) throw err;
      console.log('Data saved to MongoDB!');
      client.close();
    });
  });
  
})
.catch(error => {
console.log(error);
});






  