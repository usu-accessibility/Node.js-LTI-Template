const router = require('express').Router();
const action = require('../controllers/main-controller');
const middleware = require('../middlewares/authentication');


router.post('/health', function (req, res) {
  console.log(req);
  res.json(getHealth());
  res.end();
});

router.post('/reset_users', (req, res) => {
  const requestBody = req.body;

  if (!requestBody || !requestBody.oauth_consumer_key) {
    const data = {
      error: true,
      message: 'invalid request body',
    };
    res.json(data);
  }

  // Assuming Action.resetAlltheUsers() is a synchronous function
  // If it's asynchronous, handle it accordingly (e.g., use async/await)
  action.resetAlltheUsers();

  // Send a success response if resetAlltheUsers() doesn't throw an error
  const successData = {
    success: true,
    message: 'Users reset successfully',
  };
  res.json(successData);
});

router.post('/get_image_name', (req, res) => {
    const requestBody = req.body;
  
    if (!requestBody || !requestBody.image_id) {
      const data = {
        error: true,
        message: 'invalid request body',
      };
      res.json(data);
    }
  
    // Assuming Action.getImageName() is a synchronous function
    // If it's asynchronous, handle it accordingly (e.g., use async/await)
    const data = action.getImageName(requestBody.image_id);
    res.json(data);
});


router.post('/get_database_tables', (req, res) => {
    const requestBody = req.body;
  
    if (
      !requestBody ||
      !requestBody.table ||
      !requestBody.oauth_consumer_key
    ) {
      const data = {
        error: true,
        message: 'invalid request body',
      };
      res.json(data);
    }
  
    if (!(requestBody.oauth_consumer_key === process.env.CANVAS_ACCESS_TOKEN)) {
      action.authorize();
    }
  
    // Assuming Action.getDatabaseTables() is a synchronous function
    // If it's asynchronous, handle it accordingly (e.g., use async/await)
    const data = action.getDatabaseTables(requestBody.table);
    res.json(data);
});

router.post('/load_images', (req, res) => {
    const requestBody = req.body;
  
    if (
      (!requestBody || !requestBody.oauth_consumer_key) &&
      (!requestBody ||
        !requestBody.course_id ||
        !requestBody.is_priority ||
        typeof requestBody.is_priority !== 'boolean')
    ) {
      const data = {
        error: true,
        message: 'invalid request body',
      };
      res.json(data);
    }
  
    if (requestBody.oauth_consumer_key !== process.env.CANVAS_ACCESS_TOKEN) {
        return middleware.authorize(req, res);
    }
  
    const courseId = requestBody.course_id;
    action.validateCourseId(courseId);
  
    // Fetch the course name from the Canvas API and add the course to the courses table if it doesn't already exist
    if (!action.courseExists(courseId)) {
      const courseName = action.getCourseNameCanvas(courseId);
      action.createCourse(courseId, courseName);
    }
  
    const images = action.getCourseImages(courseId);
  
    if (images.error) {
      const data = {
        error: true,
        message: images.message,
      };
      res.json(data);
    }
  
    let errors = 0;
    let imagesAdded = 0;
  
    for (const image of images) {
      const success = action.createImage(image, requestBody.is_priority);
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
      res.json(data);
    } else {
      const message =
        errors === 1
          ? 'additional image was found that is already in the database'
          : 'additional images were found that are already in the database';
      const data = {
        images_added: imagesAdded,
        message: `${errors} ${message}`,
      };
      res.json(data);
    }
});

router.post('/get_alt_text_updated_user_name', (req, res) => {
    // retrieve and validate the request body
    const requestBody = req.body;
  
    if (!requestBody || !requestBody.image_url) {
      const data = {
        error: true,
        message: 'invalid request body',
      };
      res.json(data);
    }
  
    const imageUrl = requestBody.image_url;
    const username = action.getAltTextUpdatedUserInfo(imageUrl);
  
    if (imageUrl === 'all') {
        res.json(username);
    } else {
        const data = {
            username: username.alttext_updated_user,
            userurl: username.user_url,
        };
        res.json(data);
    }
});

router.post('/set_image_completed', (req, res) => {
    // retrieve and validate the request body
    const requestBody = req.body;
  
    if (
      !requestBody ||
      !requestBody.image_id ||
      !requestBody.alt_text ||
      !requestBody.is_decorative ||
      !requestBody.username ||
      !requestBody.userurl ||
      typeof requestBody.is_decorative !== 'boolean' ||
      (requestBody.alt_text === '' && !requestBody.is_decorative)
    ) {
      const data = {
        error: true,
        message: 'invalid request body',
      };
      res.json(data);
    }
  
    const imageId = requestBody.image_id;
    action.validateImageId(imageId);
  
    if (action.imageIsCompleted(imageId)) {
      const data = {
        error: true,
        message: 'image is already completed',
      };
      res.json(data);
    }
  
    const isDecorative = requestBody.is_decorative;
    const altText = isDecorative
      ? null
      : htmlspecialchars(requestBody.alt_text, 'ENT_QUOTES');
    const currentTime = new Date();
  
    const image = action.doesAltTextUpdatedUserExist(requestBody.image_id);
  
    if (!is_null(image.image)) {
        action.updateAltTextUserName(
            image.image_url,
            requestBody.username,
            requestBody.userurl,
            req.session.email_primary
        );
    } else {
        action.insertAltTextUser(
            image.image_url,
            requestBody.username,
            requestBody.userurl,
            req.session.email_primary
        );
    }
  
    const status = action.setImageCompleted(
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
      res.json(data);
    } else {
      const data = {
        error: true,
        message: status.message,
      };
      res.json(data);
    }
});

router.post('/push_image', (req, res) => {
    // Authorize the request
    middleware.authorize();
  
    // retrieve and validate the request body
    const requestBody = req.body;
  
    if (!requestBody || !requestBody.course_id) {
      const data = {
        error: true,
        message: 'invalid request body',
      };
      res.json(data);
      return;
    }
  
    const courseId = requestBody.course_id;
    action.validateCourseId(courseId);
  
    const images = action.getCourseCompletedImages(courseId);
    const needsConversion = action.getNeedsToConversionStatus(courseId);
  
    if (images === null || images.length === 0) {
      const data = {
        pushed_images: 0,
        message: 'there are no images that are ready to be pushed back to canvas',
      };
      res.json(data);
      return;
    }
  
    let pushedImages = 0;
    const failedImages = [];
    const newPushedImages = action.updateCourseImages(images);
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
    res.json(data);
});

router.post('/release_needs_conversion', (req, res) => {
    // Authorize the request
    action.authorize();
  
    // retrieve and validate the request body
    const requestBody = req.body;
  
    if (!requestBody || !requestBody.course_id) {
      const data = {
        error: true,
        message: 'invalid request body',
      };
      action.jsonResponse(data, res);
      return;
    }
  
    const courseId = requestBody.course_id;
    const result = action.updateNeedsConversion(courseId);
  
    res.json(data);
});

router.post('/skip_image', (req, res) => {
    // retrieve and validate the request body
    const requestBody = req.body;
  
    if (!requestBody || !requestBody.image_id) {
      const data = {
        error: true,
        message: 'invalid request body',
      };
      action.jsonResponse(data, res);
      return;
    }
  
    const imageId = requestBody.image_id;
    action.validateImageId(imageId);
  
    req.session.skippedImages.push(imageId);
  
    action.resetImage(imageId);
  
    const data = {
      error: false,
    };
    res.json(data);
});

router.post('/mark_image_as_advanced', (req, res) => {
    // retrieve and validate the request body
    const requestBody = req.body;
  
    if (!requestBody || !requestBody.image_id || !requestBody.advanced_type) {
      const data = {
        error: true,
        message: 'invalid request body',
      };
      res.json(data);
    }
  
    const imageId = requestBody.image_id;
    action.validateImageId(imageId);
  
    const advancedType = requestBody.advanced_type;
    action.validateAdvancedType(advancedType);
  
    action.markImageAsAdvanced(imageId, advancedType);
    
    const data = {
      error: false,
    };
    res.json(data);
});

router.post('/update_image_alt_text', (req, res) => {
    // retrieve and validate the request body
    const requestBody = req.body;
  
    if (
      !requestBody ||
      !requestBody.image_url ||
      !requestBody.new_alt_text ||
      !requestBody.is_decorative
    ) {
      const data = {
        error: true,
        message: 'invalid request body',
      };
      res.json(data);
    }
  
    const data = action.updateAltText(
      requestBody.image_url,
      requestBody.new_alt_text,
      requestBody.is_decorative
    );
  
    res.json(data);
});

router.post('/update_user_alt_text', (req, res) => {
    // retrieve and validate the request body
    const requestBody = req.body;
  
    if (
      !requestBody ||
      !requestBody.image_url ||
      !requestBody.new_user ||
      !requestBody.user_url
    ) {
      const data = {
        error: true,
        message: 'invalid request body',
      };
      res.json(data);
    }
  
    const data = action.updateAltTextUserName(
      requestBody.image_url,
      requestBody.new_user,
      requestBody.user_url
    );
  
    res.json(data);
});


router.post('/mark_image_as_unusable', (req, res) => {
    // retrieve and validate the request body
    const requestBody = req.body;
  
    if (!requestBody || !requestBody.image_id) {
      const data = {
        error: true,
        message: 'invalid request body',
      };
      res.json(data);
    }
  
    if (!action.imageExists(requestBody.image_id)) {
      const data = {
        error: true,
        message: "image id doesn't exist",
      };
      res.json(data);
    }
  
    const courseId = action.markImageAsUnusable(requestBody.image_id);
    const data = {
      error: false,
      image_id: requestBody.image_id,
      course_id: courseId,
    };
    res.json(data);
});


module.exports = router;
