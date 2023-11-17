const router = require('express').Router();
const action = require('../controllers/main-controller');

// const postRoutes = require('./action-post');

// router.use(postRoutes);

router.get('/', function (req, res) {
  res.json(getHealth());
});

router.get('/health', function (req, res) {
  res.json(getHealth());
  res.end();
});

router.get('/get_user_details', (req, res) => {
  const userdetails = {
      username: req.session.name_given,
      userimage: req.session.user_image,
      role: req.session.role
  };

  res.json(userdetails);
});

router.get('/get_active_courses', (req, res) => {
  const user = action.getUserByLmsId(req.session.userID);

  if (user.success) {
      const userId = user.user_id;

      const advancedType = req.query.advanced_type || "";

      const courses = [];
      const courseList = action.getActiveCourses(userId, advancedType);

      courseList.forEach((element) => {
          const courseId = element.course_id;
          const courseName = action.getCourseName(courseId);
          courses.push({ id: courseId, course_name: courseName });
      });

      res.json(courses);
  } else {
      const data = {
          error: true,
          no_images: false,
          message: 'lms id does not exist',
      };

      res.json(data);
  }
});

// const performTask = async (value) => {
//   const startTime = Date.now();

//   while (true) {
//       if (Date.now() - startTime > 300000) {
//           return false; // timeout, function took longer than 300 seconds
//       }
//   }
// };

router.get('/update_course_id', async (req, res) => {
  const user = action.getUserByLmsId(req.session.userID); // Assuming session data is available

  if (user.success) {
      const userId = user.user_id;

      if (req.query.lock) {
          const editorValue = await queryDatabase(
              "SELECT editor FROM at_image WHERE id = $1",
              [req.query.image_id]
          );

          if (editorValue.length !== 0 && editorValue[0].editor !== 0 && editorValue[0].editor !== userId) {
              const data = {
                  error: "Image has been locked by another user. Loading next image.",
              };
              res.json(data);
          } else {
              await action.updateEditorId(userId, req.query.image_id, req.query.lock);

              // Assuming you want to perform a task after updating the editor ID
              // const result = performTask(/* pass relevant value */);

              if (result) {
                  res.json({ success: true });
              } else {
                  res.json({ error: "Task timed out." });
              }
          }
      }
  } else {
      const data = {
          error: true,
          no_images: false,
          message: 'lms id does not exist',
      };
      res.json(data);
  }
});

router.get('/get_lock_status', async (req, res) => {
  const user = action.getUserByLmsId(req.session.userID); // Assuming session data is available

  if (user.success) {
      const userId = user.user_id;

      // Assuming you want to get image_id from the request parameters
      const imageId = req.query.image_id;

      const data = await action.getLockStatus(userId, imageId);

      // Send the lock status as a JSON response
      res.json({
          locked: data.length === 0 ? false : data[0].editor == userId,
      });
  } else {
      const data = {
          error: true,
          no_images: false,
          message: 'lms id does not exist',
      };
      res.json(data);
  }
});

router.get('/get_image', (req, res) => {
  const user = action.getUserByLmsId(req.session.userID); // Assuming session data is available

  if (user.success) {
      const userId = user.user_id;

      action.validateUserId(userId);

      const selectedCourseId = req.query.selectedCourse || 0;

      let image;

      if (req.query.advanced_type) {
          action.validateAdvancedType(req.query.advanced_type);
          image = action.getAdvancedImage(req.query.advanced_type, selectedCourseId, userId);
      } else {
          image = action.getImage(selectedCourseId, userId);
      }

      if (!image) {
          const data = {
              error: true,
              no_images: true,
              message: 'no images in queue',
          };
          res.json(data);
      } else {
          const courseName = action.getCourseName(image.course_id);

          const data = {
              image_id: image.id,
              url: image.image_url,
              course_name: courseName,
              image_name: image.image_name,
          };

          res.json(data);
      }
  } else {
      const data = {
          error: true,
          no_images: false,
          message: 'lms id does not exist',
      };
      res.json(data);
  }
});

router.get('/get_courses_info', (req, res) => {
  const courseIds = action.getCourseIds();
  const data = [];

  courseIds.forEach((courseId) => {
      const courseName = action.getCourseName(courseId);
      const totalImages = action.countTotalImages(courseId);
      const completedImages = action.countCompletedImages(courseId);
      const publishedImages = action.countPublishedImages(courseId);
      const advancedImages = action.countAdvancedImages(courseId);
      const availableImages = action.countAvailableImages(courseId);

      data.push({
          id: courseId,
          name: courseName,
          total_images: totalImages,
          completed_images: completedImages,
          published_images: publishedImages,
          advanced_images: advancedImages,
          available_images: availableImages,
      });
  });

  // Send the data as a JSON response
  res.json(data);
});

router.get('/get_completed_images', (req, res) => {
  const courseId = req.query.course_id;

  if (courseId) {
      const completedImages = action.getCourseCompletedImages(courseId);

      if (completedImages === null) {
          const data = {
              message: 'There are no completed images for this course',
          };
          res.json(data);
      } else {
          const data = completedImages.map((image) => ({
              image_url: image.image_url,
              alt_text: image.alt_text,
              image_id: image.id,
              is_decorative: image.is_decorative === 1 ? true : false,
              image_name: image.image_name,
              course_id: image.course_id,
          }));

          // Send the data as a JSON response
          res.json(data);
      }
  } else {
      const data = {
          error: true,
          message: 'course_id not set',
      };
      res.json(data);
  }
});

router.get('/get_image_usage', (req, res) => {
  if (req.query.image_id) {
      const imageId = req.query.image_id;

      try {
          action.validateImageId(imageId);

          const image = action.getImageInfo(imageId);
          const courseId = image.course_id;
          const imageLmsId = image.lms_id;

          const foundPageIds = action.findUsagePages(imageLmsId, courseId);

          const data = {
              image_id: imageLmsId,
              course_id: courseId,
              pages: foundPageIds.join(', '),
          };

          // Send the data as a JSON response
          res.json(data);
      } catch (error) {
          const data = {
              error: true,
              message: error.message,
          };
          res.json(data);
      }
  } else {
      const data = {
          error: true,
          message: 'invalid parameters',
      };
      res.json(data);
  }
});

router.get('/get_body', (req, res) => {
  if (req.query.page_url) {
      const pageUrl = req.query.page_url;
      const body = action.getBody(pageUrl);

      // Send the body content as a JSON response
      res.json({ body });
  } else {
      const data = {
          error: true,
          message: 'page_url not set',
      };
      res.json(data);
  }
});

router.get('/count_completed_images', (req, res) => {
  const completedImageCount = action.getCompletedImages().length;
  const data = { completed_image_count: completedImageCount };
  res.json(data);
});

router.get('/is_admin', (req, res) => {
  const isAdmin = req.session.admin || false;
  const data = { is_admin: isAdmin };
  res.json(data);
});

router.get('/test', (req, res) => {
  const testResult = action.testDb();
  const data = { test: testResult };
  res.json(data);
});

router.get('/reset_test_images', (req, res) => {
  req.session.skippedImages = [];
  action.resetTestImages();
  const data = { done: true };
  res.json(data);
});

function getHealth() {
  return {
    ok: true,
    message: 'Healthy',
  };
}

module.exports = router;
