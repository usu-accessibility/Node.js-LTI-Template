import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

import Navigation from "./pages/Navigation";
import HomePage from "./pages/HomePage";
import AdvancedImages from "./pages/AdvancedImages";
import LoadImagesPage from "./pages/LoadImagesPage";
import ReviewPublishPage from "./pages/ReviewPublishPage";

import axios from 'axios';

function App() {
  let isDev = process.env.ENVIRONMENT;

  var basePath = isDev ? 'https://61f3-139-64-171-69.ngrok-free.app' : 'https://accessibility.dheeru.link';

  var i = window.location.pathname.lastIndexOf('/');
  var navBasePath = window.location.pathname.slice(undefined, i);

  var [userRole, setUserRole] = useState("");

  function getUserDetails(){
    axios({
        method:'get',
        url:`${basePath}/get_user_details`,
      })
      .then((response) => {

        var loadJson = {};

        if(typeof response.data === "string"){
          const jsonRegex = /{[^}]+}/;
          const jsonMatch = response.data.match(jsonRegex);
    
          if (jsonMatch) {
            const jsonString = jsonMatch[0];
            loadJson = JSON.parse(jsonString);
          }
        }
        else {
          loadJson = response.data;
        }

        var role = loadJson.role;
        var role = role.split(',');
        setUserRole(role[0]);
        
      })
      .catch((error) => {
        console.log(error);
      })
  }

  useEffect(()=>{
    getUserDetails()
  }, [])
 
  return (
    <>
      <MemoryRouter initialEntries={["/"]} initialIndex={0} >
        {userRole !== "" && <Navigation basePath={navBasePath} path={basePath} userRole={userRole} />}
        <Routes>
          <Route path={"/"} element={<HomePage basePath={basePath} />} />
          <Route path={"/load_images"} element={<LoadImagesPage basePath={basePath} />} />
          <Route path={"/review_publish"} element={<ReviewPublishPage basePath={basePath} />} />
          <Route path={"/advanced_images"} element={<AdvancedImages basePath={basePath} />} />
        </Routes>
      </MemoryRouter>
    </>
  );
}

ReactDOM.render(<App />, document.getElementById("react-container"));