const action = require('../controllers/main-controller');
const middleware = require('../middlewares/authentication');

module.exports = function(router, session){

  router.post('/reset_users', async (req, res) => {
    try {
      const requestBody = req.body;

      if (!requestBody || !('oauth_consumer_key' in requestBody)) {
        const data = {
          error: true,
          message: 'invalid request body',
        };
        return res.json(data);
      }
  
      // Assuming Action.resetAlltheUsers() is a synchronous function
      // If it's asynchronous, handle it accordingly (e.g., use async/await)
      await action.resetAlltheUsers();
  
      // Send a success response if resetAlltheUsers() doesn't throw an error
      const successData = {
        success: true,
        message: 'Users reset successfully',
      };
  
      return res.json(successData);
    }
    catch(error){
        console.log(error);
    }
  });

  router.post('/get_image_name', async (req, res) => {
    try {
      const requestBody = req.body;
      if (!requestBody || !('image_id' in requestBody)) {
        const data = {
          error: true,
          message: 'invalid request body',
        };

        return res.json(data);
      }
    
      // Assuming Action.getImageName() is a synchronous function
      // If it's asynchronous, handle it accordingly (e.g., use async/await)
      const data = await action.getImageName(requestBody.image_id, requestBody.course_id);
      return res.json(data);
    }
    catch(error){
        console.log(error);
    }
  });
}

