const axios = require('axios');

const accessToken = process.env.CANVAS_TOKEN;

const tokenHeader = {
  Authorization: `Bearer ${accessToken}`,
};

var domain = 'usu.instructure.com';

// Returns a Promise that resolves to an array containing other associative arrays containing the JSON information
// Endpoints that give a single result will result in an array of length 1 being returned
async function curlGet(url) {

  try {
    const response = await axios.get(url.startsWith(domain) ? url : `https://${domain}/api/v1/${url}`, {
      headers: tokenHeader,
    });

    const data = response.data;
    
    if (data.length === 0) {
      return null;
    }

    // Parse Link Information
    // const linkHeader = response.headers['link'] || response.headers['Link'];
    // let links = {};

    // if (linkHeader) {
    //   const linkArray = linkHeader.split(',');

    //   linkArray.forEach((link) => {
    //     const [_, url, rel] = link.match(/^\s*<(.*?)>;\s*rel="(.*?)"/);
    //     links[rel] = url;
    //   });
    // }

    // // Check for Pagination
    // if (links['next']) {
    //   // Remove the API url so it is not added again in the get call
    //   const nextLink = links['next'].replace(`https://${domain}/api/v1/`, '');
    //   const nextData = await axios.get(nextLink, {
    //     headers: tokenHeader,
    //   });
    //   return data.concat(nextData);
    // } else {
    //   return data;
    // }

    return data;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

async function curlPut(url, data) {
  try {
    console.log(data);
    // Perform the PUT request using axios
    const response = await axios.put(`https://usu.instructure.com/api/v1/${url}`, data, {
      headers: tokenHeader,
    });

    // Return the response data
    console.log(response);
    return response.data;
  } catch (error) {
    // Handle errors
    throw new Error(`Error in curlPut: ${error.message}`);
  }
}


module.exports = {
    curlGet,
    curlPut
}