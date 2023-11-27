const action = require('../controllers/main-controller');
const middleware = require('../middlewares/authentication');

module.exports = function(router, session){

  async function htmlspecialchars(text) {
    var map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    
    return text.replace(/[&<>"']/g, function(m) { return map[m]; });
  }

  router.post('/reset_users', async (req, res) => {
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
  });

  router.post('/get_image_name', async (req, res) => {
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
  });


  router.post('/get_database_tables', async (req, res) => {
      const requestBody = req.body;
    
      if (
        !requestBody ||
        !('table' in requestBody) ||
        !('oauth_consumer_key' in requestBody)
      ) {
        const data = {
          error: true,
          message: 'invalid request body',
        };
        return res.json(data);
      }
      
      if (!(requestBody.oauth_consumer_key === process.env.CANVAS_ACCESS_TOKEN)) {
        await middleware.authorize(res, session);
      }
    
      // Assuming Action.getDatabaseTables() is a synchronous function
      // If it's asynchronous, handle it accordingly (e.g., use async/await)
      const data = await action.getDatabaseTables(requestBody.table);
      return res.json(data);
  });

  router.post('/load_images', async (req, res) => {
      const requestBody = req.body;
    
      if (
        (!requestBody || !('oauth_consumer_key' in requestBody) ||
          !('course_id' in requestBody) ||
          !('is_priority' in requestBody) ||
          typeof requestBody.is_priority !== 'boolean')
      ) {
        const data = {
          error: true,
          message: 'invalid request body',
        };
        return res.json(data);
      }
    
      if (requestBody.oauth_consumer_key !== process.env.CANVAS_ACCESS_TOKEN) {
        var isAuthorized = await middleware.authorize(res, session);
        if(!isAuthorized){
          return res.status(403).json({ error: "you don't have permission to access this resource" });
        }
      }
    
      const courseId = requestBody.course_id;
      var isCourseIdValid = await action.validateCourseId(courseId);
      if(isCourseIdValid !== null){
        return isCourseIdValid;
      }
    
      // Fetch the course name from the Canvas API and add the course to the courses table if it doesn't already exist
      if (!await action.courseExists(courseId)) {
        const courseName = await action.getCourseNameCanvas(courseId);
        await action.createCourse(courseId, courseName);
      }
    
      const images = await action.getCourseImages(courseId);

      console.log(images);

      if (images.error) {
        const data = {
          error: true,
          message: images.message,
        };
        return res.json(data);
      }
    
      let errors = 0;
      let imagesAdded = 0;
    
      for (const image of images) {
        const success = await action.createImage(image, requestBody.is_priority, session);
        if (success) {
          imagesAdded++;
        } else {
          errors++;
        }
      }
    
      if (errors === 0) {
        const data = {
          images_added: imagesAdded,
        };
        return res.json(data);
      } else {
        const message =
          errors === 1
            ? 'additional image was found that is already in the database'
            : 'additional images were found that are already in the database';
        const data = {
          images_added: imagesAdded,
          message: `${errors} ${message}`,
        };
        return res.json(data);
      }
  });

  router.post('/get_alt_text_updated_user_name', async (req, res) => {
      // retrieve and validate the request body
      const requestBody = req.body;
    
      if (!requestBody || !('image_url' in requestBody)) {
        const data = {
          error: true,
          message: 'invalid request body',
        };
        return res.json(data);
      }
    
      const imageUrl = requestBody.image_url;
      const username = await action.getAltTextUpdatedUserInfo(imageUrl);
    
      if (imageUrl === 'all') {
          return res.json(username);
      } else {
          const data = {
              username: username.alttext_updated_user,
              userurl: username.user_url,
          };
          return res.json(data);
      }
  });

  router.post('/set_image_completed', async (req, res) => {
      // retrieve and validate the request body
      const requestBody = req.body;
      console.log(requestBody)
      if (
        !requestBody ||
        !('image_id' in requestBody) ||
        !('alt_text' in requestBody) ||
        !('is_decorative' in requestBody) ||
        !('username' in requestBody) ||
        !('userurl' in requestBody) ||
        typeof requestBody.is_decorative !== 'boolean' ||
        (requestBody.alt_text === '' && !requestBody.is_decorative)
      ) {
        const data = {
          error: true,
          message: 'invalid request body',
        };
        return res.json(data);
      }
    
      const imageId = requestBody.image_id;

      var validateImageId = await action.validateImageId(imageId);
      if( validateImageId !== null){
        return res.json(validateImageId);
      }

    
      if (await action.imageIsCompleted(imageId)) {
        const data = {
          error: true,
          message: 'image is already completed',
        };
        return res.json(data);
      }
    
      const isDecorative = requestBody.is_decorative;
      const altText = isDecorative
        ? null
        : await htmlspecialchars(requestBody.alt_text);

      const currentTime = new Date();
    
      const image = await action.doesAltTextUpdatedUserExist(requestBody.image_id);
    
      if (!(image.image === null)) {
          await action.updateAltTextUserName(
              image.image_url,
              requestBody.username,
              requestBody.userurl,
              req.session.email_primary
          );
      } else {
          await action.insertAltTextUser(
              image.image_url,
              requestBody.username,
              requestBody.userurl,
              req.session.email_primary
          );
      }
    
      const status = await action.setImageCompleted(
        imageId,
        altText,
        isDecorative,
        currentTime
      );
    
      if (status.success) {
        const data = {
          image_id: imageId,
          alt_text: altText,
          is_decorative: isDecorative,
          date_completed: currentTime,
        };
        return res.json(data);
      } else {
        const data = {
          error: true,
          message: status.message,
        };
        return res.json(data);
      }
  });

  router.post('/push_image', async (req, res) => {
      // Authorize the request
      await middleware.authorize(res, session);
    
      // retrieve and validate the request body
      const requestBody = req.body;
    
      if (!requestBody || !('course_id' in requestBody)) {
        const data = {
          error: true,
          message: 'invalid request body',
        };
        return res.json(data);
        return;
      }
    
      const courseId = requestBody.course_id;
      await action.validateCourseId(courseId);
    
      const images = await action.getCourseCompletedImages(courseId);
      const needsConversion = await action.getNeedsToConversionStatus(courseId);
    
      if (images === null || images.length === 0) {
        const data = {
          pushed_images: 0,
          message: 'there are no images that are ready to be pushed back to canvas',
        };
        return res.json(data);
        return;
      }
    
      let pushedImages = 0;
      const failedImages = [];
      const newPushedImages = await action.updateCourseImages(images);
      if (newPushedImages === -1) {
        failedImages.push(images[0].course_id);
      } else {
        pushedImages += newPushedImages;
      }
    
      const data = {
        pushed_images: pushedImages,
        needs_conversion: needsConversion,
      };
    
      if (failedImages.length > 0) {
        data.failed_image_ids = failedImages.join(', ');
        data.message =
          'images failing to push is usually caused by the course no longer existing in canvas';
      }
    
      // Action.updateMondayBoard(courseId);
      return res.json(data);
  });

  router.post('/release_needs_conversion', async (req, res) => {
      // Authorize the request
      await middleware.authorize(res, session);
    
      // retrieve and validate the request body
      const requestBody = req.body;
    
      if (!requestBody || !('course_id' in requestBody)) {
        const data = {
          error: true,
          message: 'invalid request body',
        };
        await action.jsonResponse(data, res);
        return;
      }
    
      const courseId = requestBody.course_id;
      const result = await action.updateNeedsConversion(courseId);
    
      return res.json(data);
  });

  router.post('/skip_image', async (req, res) => {
      // retrieve and validate the request body
      const requestBody = req.body;
    
      if (!requestBody || !('image_id' in requestBody)) {
        const data = {
          error: true,
          message: 'invalid request body',
        };
        await action.jsonResponse(data, res);
        return;
      }
    
      const imageId = requestBody.image_id;

      var validateImageId = await action.validateImageId(imageId);
      if( validateImageId !== null){
        return validateImageId;
      }
    
      req.session.skippedImages.push(imageId);
    
      await action.resetImage(imageId);
    
      const data = {
        error: false,
      };
      return res.json(data);
  });

  router.post('/mark_image_as_advanced', async (req, res) => {
      // retrieve and validate the request body
      const requestBody = req.body;
    
      if (!requestBody || !('image_id' in requestBody) || !('advanced_type' in requestBody)) {
        const data = {
          error: true,
          message: 'invalid request body',
        };
        return res.json(data);
      }
    
      const imageId = requestBody.image_id;

      var validateImageId = await action.validateImageId(imageId);
      if( validateImageId !== null){
        return validateImageId;
      }
    
      const advancedType = requestBody.advanced_type;
      await action.validateAdvancedType(advancedType);
    
      await action.markImageAsAdvanced(imageId, advancedType);
      
      const data = {
        error: false,
      };
      return res.json(data);
  });

  router.post('/update_image_alt_text', async (req, res) => {
      // retrieve and validate the request body
      const requestBody = req.body;
    
      if (
        !requestBody ||
        !('image_url' in requestBody) ||
        !('new_alt_text' in requestBody) ||
        !('is_decorative' in requestBody)
      ) {
        const data = {
          error: true,
          message: 'invalid request body',
        };
        return res.json(data);
      }
    
      const data = await action.updateAltText(
        requestBody.image_url,
        requestBody.new_alt_text,
        requestBody.is_decorative
      );
    
      return res.json(data);
  });

  router.post('/update_user_alt_text', async (req, res) => {
      // retrieve and validate the request body
      const requestBody = req.body;
    
      if (
        !requestBody ||
        !('image_url' in requestBody) ||
        !('new_user' in requestBody) ||
        !('user_url' in requestBody)
      ) {
        const data = {
          error: true,
          message: 'invalid request body',
        };
        return res.json(data);
      }
    
      const data = await action.updateAltTextUserName(
        requestBody.image_url,
        requestBody.new_user,
        requestBody.user_url
      );
    
      return res.json(data);
  });


  router.post('/mark_image_as_unusable', async (req, res) => {
      // retrieve and validate the request body
      const requestBody = req.body;
    
      if (!requestBody || !('image_id' in requestBody)) {
        const data = {
          error: true,
          message: 'invalid request body',
        };
        return res.json(data);
      }
    
      if (!await action.imageExists(requestBody.image_id)) {
        const data = {
          error: true,
          message: "image id doesn't exist",
        };
        return res.json(data);
      }
    
      const courseId = await action.markImageAsUnusable(requestBody.image_id);
      const data = {
        error: false,
        image_id: requestBody.image_id,
        course_id: courseId,
      };
      return res.json(data);
  });
}

