import React, { useState, useEffect,Image} from "react";
import { Select, Dropdown, Menu } from "antd";
import FacebookLogin from "react-facebook-login";
import axios from "axios";
import Moviebank from'./images/moviebank.png'

function App() {
  const [ids, setIds] = useState([]);
  const [matchedPosts, setMatchedPosts] = useState([]);
  const [userData, setUserData] = useState();

  console.log(userData)

  const items = ["Restaurant", "Beauty", "Fashion"];

  const componentClicked = () => {
    console.log("Facebook button clicked");
  };

  const handleFacebookResponse = async (response) => {
    setUserData(response);
    
    try {
      const { accessToken } = response;

      // Make an Axios call to the Facebook Graph API to get the user's Instagram Business Account ID
      const { data } = await axios.get(`https://graph.facebook.com/v12.0/me?fields=accounts{instagram_business_account{id,username,followers_count}}&access_token=${accessToken}`);

      const instagramBusinessAccount = data.accounts.data[0].instagram_business_account;

      const { id, username, followers_count } = instagramBusinessAccount;

      // Make another Axios call to fetch media insights for the Instagram Business Account
      const insightsResponse = await axios.get(`https://graph.facebook.com/v12.0/${id}/insights?metric=impressions,reach,profile_views&period=day&access_token=${accessToken}`);

      const mediaInsights = insightsResponse.data.data;

      // Make another Axios call to fetch media for the Instagram Business Account
      const mediaResponse = await axios.get(`https://graph.facebook.com/v12.0/${id}/media?fields=id,username,follower_count,caption,media_type,media_url,thumbnail_url,permalink&limit=10&access_token=${accessToken}`);

      const media = mediaResponse.data.data.map((item) => ({
        ...item,
        followers_count: username === item.username ? followers_count : 0,
      }));

      // Log both insights and media
      console.log('Instagram Business Account:', instagramBusinessAccount);
      console.log('Media Insights:', mediaInsights);
      console.log('Media:', media);

      // Make an API call to the backend server to store the data in the MongoDB database named Facebook
      await axios.post('http://localhost:3000/api/facebook-data', {
        instagramBusinessAccount,
        mediaInsights,
        media,
      });

      await axios.post("http://localhost:3000/api/facebook", {
        accessToken: response.accessToken,
      })
      .then((res) => {
        console.log(res.data);
      })
      .catch((err) => {
        console.log("error", err);
      });
    } catch (error) {
      console.error('Error storing data in MongoDB:', error);
    }
  };

  const responseFacebook = (response) => {
    setUserData(response);
    console.log("userData: ", response);
    axios
      .post("http://localhost:3000/api/facebook", {
        accessToken: response.accessToken,
      })
      .then((res) => {
        console.log(res.data);
      })
      .catch((err) => {
        console.log("error", err);
      });
  };

  const handleMenuClick = async (e) => {
  //  const data = await axios.post("http://localhost:3000/api/posts", {
  //     data: e
  //   }, {
  //     headers: {
  //       'Content-Type': 'application/x-www-form-urlencoded'
  //     }
  //   })

     const data = await axios.post("http://localhost:3000/api/instaData", {
      data: e
    }, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })

    console.log(data)

  
    // console.log(data)
    let idArray = [];
    let dataArray = []
    data.data.map(item => {
      !idArray.includes(item.id) && dataArray.push(item);
      idArray.push(item.id)
    })
    console.log(dataArray)
    setMatchedPosts(dataArray)
  };

  return (
    <div className="App">
         <Menu mode="horizontal"  theme='dark'>
       <Menu.Item className="logo-wrapper">
       <img src={Moviebank} alt="moviebank"/>
        
        </Menu.Item>
        {/* <SubMenu title={<span>Blogs</span>}>
          <MenuItemGroup title="Item 1">
            <Menu.Item key="setting:1">Option 1</Menu.Item>
            <Menu.Item key="setting:2">Option 2</Menu.Item>
          </MenuItemGroup>
          <MenuItemGroup title="Item 2">
            <Menu.Item key="setting:3">Option 3</Menu.Item>
            <Menu.Item key="setting:4">Option 4</Menu.Item>
          </MenuItemGroup>
        </SubMenu> */}
        {/* <Menu.Item key="alipay">
          <a href="">Contact Us</a>
        </Menu.Item> */}
      </Menu>
      {!userData ? (
        <div class="fb-login-box">
          
          
        {/* <FacebookLogin
          appId="510971874509018"
          autoLoad={true}
          fields={
            "name,email, picture,last_name,first_name,gender,friends,birthday,likes,posts"
          }
          onClick={componentClicked}
          callback={responseFacebook}
        /> */}

<FacebookLogin
      appId="1827303767640430"
      // fields="name,email,picture"
      fields="name,email, picture,last_name,first_name,gender,friends,birthday,likes,posts"
      callback={handleFacebookResponse}
    />

          </div>
      ) :
      (
        <div className="influencer-recommend">
          <h1 className="heading">Influencer Recommedation</h1>
        
        <Select className="influencer-dropdown"  onChange={handleMenuClick} size="large" placeholder = "Select Your Influencer">
        {items.map((item) => (
          <Select.Option key={item}>{item}</Select.Option>
        ))}
      </Select>
        {/* <Dropdown overlay={menu}>
          <a className="ant-dropdown-link" onClick={(e) => e.preventDefault()}>
            {selectedItem} ▼
          </a>
        </Dropdown> */}
        {matchedPosts.length > 0 && (
          <div>
            <h2>Matched Posts:</h2>
            <ul>
            {console.log("post", matchedPosts, ids)}

              {matchedPosts.map((post) => (
                <li key={post.id}>{post.name}</li>
              ))}
            </ul>
          </div>
        )}
        </div>
      )}
          

    </div>
  );
}

export default App;





















