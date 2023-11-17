const sql = require('../services/sql-service');
const canvas_service = require('../services/canvas-service');
const { DateTime } = require('luxon'); // Use a library like luxon for handling dates
const axios = require('axios');

async function testDB(){
    var table_name = 'at_image';
    var columns = "*";

    return await sql.readData(table_name, columns);
}

async function getCanvasPage(courseId){
    var table_name = 'at_image';
    var columns = "canvas_page";

    return await sql.readDataOnCondition(table_name, 'lms_id', courseId, columns);
}

async function getDatabaseTables(courseId){
    var table_name = 'at_image';
    var columns = "canvas_page";

    return await sql.readDataOnCondition(table_name, 'lms_id', courseId, columns);
}

async function getDatabaseTables(table) {
    let table_name, columns;
  
    switch (table) {
      case 'at_image':
        table_name = 'at_image';
        columns = '*';
        return await sql.readData(table_name, columns);
  
      case 'at_user':
        table_name = 'at_user';
        columns = '*';
        return await sql.readData(table_name, columns);
  
      case 'at_course':
        table_name = 'at_course';
        columns = '*';
        return await sql.readData(table_name, columns);
  
      case 'at_alt_text':
        table_name = 'at_alt_text';
        columns = '*';
        return await sql.readData(table_name, columns);
  
      default:
        throw new Error('Invalid table name');
    }
}

async function getAssignmentPage(courseId) {
    const table_name = 'at_image';
    const columns = 'assignment_url';
  
    return await sql.readDataOnCondition(table_name, 'lms_id', courseId, columns);
}

async function getTopicPage(courseId) {
    const table_name = 'at_image';
    const columns = 'topic_url';
  
    return await sql.readDataOnCondition(table_name, 'lms_id', courseId, columns);
}
  
async function updateEditorId(userId, id, lockStatus) {
    const table_name = 'at_image';
  
    const values = {
      editor: lockStatus !== "false" ? userId : 0
    };
  
    return await sql.updateData(table_name, 'id', id, values);
}
  
async function getLockStatus(id) {
    const table_name = 'at_image';
    const columns = 'editor';

    return await sql.readDataOnCondition(table_name, 'id', id, columns);
}

async function resetTestImages() {
    const table_name = 'at_image';
  
    if (true) {
      const values = {
        editor: null,
        alt_text: null,
        is_decorative: null,
        completed_at: null,
        advanced_type: null,
        pushed_to_canvas: 0,
        is_unusable: 0
      };
  
      return await sql.updateData(table_name, 'id', "None", values); 
    }
    // else {
    //   const values = {
    //     editor: 0,
    //     alt_text: '',
    //     is_decorative: null,
    //     completed_at: '0000-00-00',
    //     pushed_to_canvas: 0,
    //     advanced_type: null,
    //     is_unusable: 0
    //   };
  
    //   const condition = 'id < 10';
  
    //   return sql.updateDataOnCondition(table_name, condition, values);
    // }
  }

// Function to get alt text updated user info
async function getAltTextUpdatedUserInfo(imageUrl) {
    const table_name = 'at_alt_text';
  
    if (imageUrl === "all") {
      const allAltTextData = await sql.readData(table_name, '*');
      return allAltTextData;
    } 
    else {
      const columns = ['alttext_updated_user', 'user_url'];
      const altTextUserInfo = await sql.readDataOnCondition(table_name, 'image_url', imageUrl, columns);
      return altTextUserInfo[0];
    }
}

// Function to get active courses
async function getActiveCourses(userId, advancedType) {
  const table_name = 'at_image';

  let activeCoursesQuery;

  if (advancedType !== "") {
    activeCoursesQuery = `
      SELECT id, course_id FROM ${table_name} 
      WHERE completed_at = '0000-00-00 00:00:00' AND is_unusable=0 AND (editor = 0 OR editor = ?) AND advanced_type = ?
      ORDER BY created_at ASC
    `;
  } else {
    activeCoursesQuery = `
      SELECT id, course_id FROM ${table_name} 
      WHERE completed_at = '0000-00-00 00:00:00' AND advanced_type IS NULL AND is_unusable=0 AND (editor = 0 OR editor = ?)
      ORDER BY created_at ASC
    `;
  }

  const activeCourses = await sql.query(activeCoursesQuery, [userId, advancedType]);
  return activeCourses;
}

// Function to get an image
async function getImage(selectedCourseId, userId) {
  const table_name = 'at_image';

  let imageQuery;

  if (!session.skippedImages || session.skippedImages.length === 0) {
    imageQuery = `
      SELECT id, image_url, course_id, image_name FROM ${table_name} 
      WHERE completed_at = '0000-00-00 00:00:00' AND advanced_type IS NULL AND is_unusable=0 AND course_id = ? AND editor = ?
      ORDER BY created_at ASC
      LIMIT 1
    `;

    let image = await sql.queryFirstRow(imageQuery, [selectedCourseId, userId]);

    if (!image) {
      imageQuery = `
        SELECT id, image_url, course_id, image_name FROM ${table_name} 
        WHERE completed_at = '0000-00-00 00:00:00' AND advanced_type IS NULL AND is_unusable=0 AND course_id = ? AND editor = 0
        ORDER BY created_at ASC
        LIMIT 1
      `;

      image = await sql.queryFirstRow(imageQuery, [selectedCourseId]);
    }

    if (!image) {
      imageQuery = `
        SELECT id, image_url, course_id, image_name FROM ${table_name} 
        WHERE completed_at = '0000-00-00 00:00:00' AND advanced_type IS NULL AND is_unusable = 0 AND editor = ?
        ORDER BY is_priority DESC, created_at ASC
        LIMIT 1
      `;

      image = await sql.queryFirstRow(imageQuery, [userId]);

      if (!image) {
        imageQuery = `
          SELECT id, image_url, course_id, image_name FROM ${table_name} 
          WHERE completed_at = '0000-00-00 00:00:00' AND advanced_type IS NULL AND is_unusable = 0 AND editor = 0
          ORDER BY is_priority DESC, created_at ASC
          LIMIT 1
        `;

        image = await sql.queryFirstRow(imageQuery);
      }
    }
  } else {
    imageQuery = `
      SELECT id, image_url, course_id, image_name FROM ${table_name} 
      WHERE completed_at = '0000-00-00 00:00:00' AND id NOT IN (?) AND advanced_type IS NULL AND is_unusable=0 AND course_id = ? AND editor = ?
      ORDER BY created_at ASC
      LIMIT 1
    `;

    let image = await sql.queryFirstRow(imageQuery, [session.skippedImages, selectedCourseId, userId]);

    if (!image) {
      imageQuery = `
        SELECT id, image_url, course_id, image_name FROM ${table_name} 
        WHERE completed_at = '0000-00-00 00:00:00' AND id NOT IN (?) AND advanced_type IS NULL AND is_unusable=0 AND course_id = ? AND editor = 0
        ORDER BY created_at ASC
        LIMIT 1
      `;

      image = await sql.queryFirstRow(imageQuery, [session.skippedImages, selectedCourseId]);
    }

    if (!image) {
      imageQuery = `
        SELECT id, image_url, course_id, image_name FROM ${table_name} 
        WHERE completed_at = '0000-00-00 00:00:00' AND id NOT IN (?) AND advanced_type IS NULL AND is_unusable=0 AND editor = ?
        ORDER BY is_priority DESC, created_at ASC
        LIMIT 1
      `;

      image = await sql.queryFirstRow(imageQuery, [session.skippedImages, userId]);

      if (!image) {
        imageQuery = `
          SELECT id, image_url, course_id, image_name FROM ${table_name} 
          WHERE completed_at = '0000-00-00 00:00:00' AND id NOT IN (?) AND advanced_type IS NULL AND is_unusable=0 AND editor = 0
          ORDER BY is_priority DESC, created_at ASC
          LIMIT 1
        `;

        image = await sql.queryFirstRow(imageQuery, [session.skippedImages]);
      }
    }
  }

  return image;
}

// Function to get an advanced image
async function getAdvancedImage(advancedType, selectedCourseId, userId) {
  const table_name = 'at_image';

  let imageQuery;

  if (!session.skippedImages || session.skippedImages.length === 0) {
    imageQuery = `
      SELECT id, image_url, course_id, image_name FROM ${table_name} 
      WHERE completed_at = '0000-00-00 00:00:00' AND advanced_type=? AND is_unusable=0 AND course_id = ? AND editor = ?
      ORDER BY created_at ASC
      LIMIT 1
    `;

    let image = await sql.queryFirstRow(imageQuery, [advancedType, selectedCourseId, userId]);

    if (!image) {
      imageQuery = `
        SELECT id, image_url, course_id, image_name FROM ${table_name} 
        WHERE completed_at = '0000-00-00 00:00:00' AND advanced_type=? AND is_unusable=0 AND course_id = ? AND editor = 0
        ORDER BY is_priority DESC, created_at ASC
        LIMIT 1
      `;

      image = await sql.queryFirstRow(imageQuery, [advancedType, selectedCourseId]);
    }

    if (!image) {
      imageQuery = `
        SELECT id, image_url, course_id, image_name FROM ${table_name} 
        WHERE completed_at = '0000-00-00 00:00:00' AND advanced_type=? AND is_unusable=0 AND editor = ?
        ORDER BY is_priority DESC, created_at ASC
        LIMIT 1
      `;

      image = await sql.queryFirstRow(imageQuery, [advancedType, userId]);

      if (!image) {
        imageQuery = `
          SELECT id, image_url, course_id, image_name FROM ${table_name} 
          WHERE completed_at = '0000-00-00 00:00:00' AND advanced_type=? AND is_unusable=0 AND editor = 0
          ORDER BY is_priority DESC, created_at ASC
          LIMIT 1
        `;

        image = await sql.queryFirstRow(imageQuery, [advancedType]);
      }
    }
  } else {
    imageQuery = `
      SELECT id, image_url, course_id, image_name FROM ${table_name} 
      WHERE completed_at = '0000-00-00 00:00:00' AND id NOT IN (?) AND advanced_type=? AND is_unusable=0 AND course_id = ? AND editor = ?
      ORDER BY created_at ASC
      LIMIT 1
    `;

    let image = await sql.queryFirstRow(imageQuery, [session.skippedImages, advancedType, selectedCourseId, userId]);

    if (!image) {
      imageQuery = `
        SELECT id, image_url, course_id, image_name FROM ${table_name} 
        WHERE completed_at = '0000-00-00 00:00:00' AND id NOT IN (?) AND advanced_type=? AND is_unusable=0 AND course_id = ? AND editor = 0
        ORDER BY is_priority DESC, created_at ASC
        LIMIT 1
      `;

      image = await sql.queryFirstRow(imageQuery, [session.skippedImages, advancedType, selectedCourseId]);
    }

    if (!image) {
      imageQuery = `
        SELECT id, image_url, course_id, image_name FROM ${table_name} 
        WHERE completed_at = '0000-00-00 00:00:00' AND id NOT IN (?) AND advanced_type=? AND is_unusable=0 AND editor = ?
        ORDER BY is_priority DESC, created_at ASC
        LIMIT 1
      `;

      image = await sql.queryFirstRow(imageQuery, [session.skippedImages, advancedType, userId]);

      if (!image) {
        imageQuery = `
          SELECT id, image_url, course_id, image_name FROM ${table_name} 
          WHERE completed_at = '0000-00-00 00:00:00' AND id NOT IN (?) AND advanced_type=? AND is_unusable=0 AND editor = 0
          ORDER BY is_priority DESC, created_at ASC
          LIMIT 1
        `;

        image = await sql.queryFirstRow(imageQuery, [session.skippedImages, advancedType]);
      }
    }
  }

  return image;
}

// Function to get user by LMS ID
async function getUserByLmsId(lmsId) {
  const table_name = 'at_user';

  const user = await sql.queryFirstRow(
    `SELECT id FROM ${table_name}
    WHERE lms_id=?
    LIMIT 1`,
    lmsId
  );

  if (!user) {
    return {
      success: false,
      message: 'user does not exist'
    };
  } else {
    return {
      success: true,
      user_id: user.id,
      lms_id: lmsId
    };
  }
}

// Function to increment images completed for a user
async function incrementImagesCompleted(userId) {
    const table_name = 'at_user';
  
    const oldVal = (await sql.queryFirstRow(
      `SELECT images_completed
      FROM ${table_name}
      WHERE id=?`,
      userId
    ))?.images_completed;
  
    if (oldVal !== undefined) {
      const newVal = oldVal + 1;
      await sql.query(
        `UPDATE ${table_name}
        SET images_completed=?
        WHERE id=?`,
        [newVal, userId]
      );
    }
}

// Function to set image as completed
async function setImageCompleted(imageId, altText, isDecorative, currentTime) {
    const connection = await mysql.createConnection(dbConfig);
  
    try {
      const [image] = await connection.execute(
        'SELECT editor FROM at_image WHERE id=? LIMIT 1',
        [imageId]
      );
  
      if (!image || !image[0].editor) {
        return {
          success: false,
          message: 'image does not have an editor',
        };
      }
  
      let updateQuery;
      let updateParams;
  
      if (isDecorative) {
        updateQuery = `
          UPDATE at_image
          SET alt_text=NULL, is_decorative=?, completed_at=?
          WHERE id=?
        `;
        updateParams = [isDecorative, currentTime, imageId];
      } else {
        updateQuery = `
          UPDATE at_image
          SET alt_text=?, is_decorative=NULL, completed_at=?
          WHERE id=?
        `;
        updateParams = [altText, currentTime, imageId];
      }
  
      const [result] = await connection.execute(updateQuery, updateParams);
  
      if (result.affectedRows === 1) {
        await incrementImagesCompleted(image[0].editor, connection);
        return {
          success: true,
          message: 'success!',
        };
      }
  
      return {
        success: false,
        message: 'no images were affected',
      };
    } catch (error) {
      console.error('Error:', error.message);
      return {
        success: false,
        message: 'An error occurred',
      };
    } finally {
      await connection.end();
    }
}

// Function to check if a user exists by ID
async function userExists(userId) {
    const table_name = 'at_user';
  
    const user = await sql.queryFirstRow(
      `SELECT 1 FROM ${table_name}
      WHERE id=?
      LIMIT 1`,
      userId
    );
  
    return !!(user && user.length > 0);
}
  
// Function to check if a user with a specific LMS ID exists
async function lmsIdExists(lmsId) {
    const table_name = 'at_user';
  
    const user = await sql.queryFirstRow(
      `SELECT 1 FROM ${table_name}
      WHERE lms_id=?
      LIMIT 1`,
      lmsId
    );
  
    return !!(user && user.length > 0);
}

// Function to check if an image exists by ID
async function imageExists(imageId) {
    const table_name = 'at_image';
  
    const image = await sql.queryFirstRow(
      `SELECT 1 FROM ${table_name}
      WHERE id=?
      LIMIT 1`,
      imageId
    );
  
    return !!(image && image.length > 0);
}

// Function to check if a course exists by ID
async function courseExists(courseId) {
    const table_name = 'at_course';
  
    const course = await sql.queryFirstRow(
      `SELECT 1 FROM ${table_name}
      WHERE id=?
      LIMIT 1`,
      courseId
    );
  
    return !!(course && course.length > 0);
  }

  // Function to check if an image is completed by ID
async function imageIsCompleted(imageId) {
    const table_name = 'at_image';
  
    const image = await sql.queryFirstRow(
      `SELECT completed_at FROM ${table_name}
      WHERE id=?
      LIMIT 1`,
      imageId
    );
  
    return (
      image &&
      image.completed_at !== '0000-00-00 00:00:00' &&
      !is_null(image.completed_at)
    );
}

// Function to check if an Alt Text Updated User exists by image ID
async function doesAltTextUpdatedUserExist(imageId) {
    const imageTable = 'at_image';
    const altTextTable = 'at_alt_text';
  
    const imageUrl = await sql.queryFirstRow(
      `SELECT image_url FROM ${imageTable}
      WHERE id=?
      LIMIT 1`,
      imageId
    );
  
    const altTextUser = await sql.queryFirstRow(
      `SELECT image_url FROM ${altTextTable}
      WHERE image_url=?
      LIMIT 1`,
      imageUrl.image_url
    );
  
    return {
      image_url: imageUrl,
      image: altTextUser && altTextUser.image_url,
    };
}

// Function to update Alt Text user name, user URL, and email by image URL
async function updateAltTextUserName(imageUrl, userName, userUrl, email) {
    const table_name = 'at_alt_text';
  
    const result = await sql.query(
      `UPDATE ${table_name}
      SET alttext_updated_user=?, user_url=?, email=?
      WHERE image_url=?`,
      [userName, userUrl, email, imageUrl]
    );
  
    return result;
}

// Function to update Alt Text user name comment by image URL
async function updateAltTextUserNameComment(imageUrl, comment) {
    const table_name = 'at_alt_text';
  
    const result = await sql.query(
      `UPDATE ${table_name}
      SET feedback=?
      WHERE image_url=?`,
      [comment, imageUrl]
    );
  
    return result;
}

async function getImageName(lmsId, courseId) {
  try {
    const files = await canvas_service.curlGet(`courses/${courseId}/files/${lmsId}`);

    if (files === null) {
      return {
        error: true,
        message: 'Course does not contain any images'
      };
    } else if (files.errors) {
      return {
        error: true,
        message: `Canvas error: ${files.errors[0].message}`,
      };
    }

    return files;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

async function createImage(image, isPriority) {
  try {
    const imageExists = await sql.queryFirstRow(
      "SELECT 1 FROM at_image WHERE lms_id = ? LIMIT 1",
      [image.lmsId]
    );

    if (!imageExists) {
      const canvasPage = image.canvas_page || "";
      const assignmentUrl = image.assignment_url || "";
      const topicUrl = image.topic_url || "";

      const imageData = await getImageName(image.lmsId, image.courseId);

      await sql.createData('at_image', {
        lms_id: image.lmsId,
        course_id: image.courseId,
        image_url: image.url,
        is_priority: isPriority,
        created_at: DateTime.local().toString(), 
        canvas_page: canvasPage,
        assignment_url: assignmentUrl,
        topic_url: topicUrl,
        image_name: imageData.display_name,
      });

      return true;
    } else {
      return false;
    }
  } catch (error) {
    console.error(error);
    throw error;
  }
}


async function getCompletedImages() {
  try {
    const completedImages = await sql.queryFirstRow(
      "SELECT id, lms_id, course_id, alt_text, is_decorative FROM at_image WHERE NOT completed_at='0000-00-00 00:00:00' AND pushed_to_canvas=0",
      []
    );

    return completedImages;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

async function getCourseCompletedImages(courseId) {
  try {
    const courseCompletedImages = await sql.queryFirstRow(
      "SELECT id, lms_id, course_id, image_url, alt_text, is_decorative, image_name FROM at_image WHERE course_id=? AND NOT completed_at='0000-00-00 00:00:00' AND pushed_to_canvas=0",
      [courseId]
    );

    return courseCompletedImages;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

async function getCourseIds() {
  try {
    const courses = await sql.queryFirstRow("SELECT id FROM at_course", []);
    const ids = courses.map(course => course.id);

    return ids;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

async function getCourseName(courseId) {
  try {
    const course = await sql.queryFirstRow(
      "SELECT course_name FROM at_course WHERE id=? LIMIT 1",
      [courseId]
    );

    return course.course_name;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

async function countTotalImages(courseId) {
  try {
    const totalImagesCount = await sql.queryFirstRow(
      "SELECT COUNT(id) FROM at_image WHERE course_id=?",
      [courseId]
    );

    return totalImagesCount[0]['COUNT(id)'];
  } catch (error) {
    console.error(error);
    throw error;
  }
}

async function resetAlltheUsers() {
  try {
    await sql.queryFirstRow(
      "UPDATE at_image SET editor = 0 WHERE editor != 0"
    );
  } catch (error) {
    console.error(error);
    throw error;
  }
}

async function getNeedsToConversionStatus(courseId) {
  try {
    const needsConversionStatus = await sql.queryFirstRow(
      "SELECT needs_conversion FROM at_course WHERE id=?",
      [courseId]
    );

    return needsConversionStatus.needs_conversion;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

async function updateNeedsConversion(courseId) {
  try {
    await sql.queryFirstRow(
      "UPDATE at_course SET needs_conversion = 0 WHERE id=?",
      [courseId]
    );
  } catch (error) {
    console.error(error);
    throw error;
  }
}

async function countCompletedImages(courseId) {
  try {
    const completedImagesCount = await sql.queryFirstRow(
      "SELECT COUNT(id) FROM at_image WHERE course_id=? AND completed_at IS NOT NULL AND completed_at!='0000-00-00 00:00:00'",
      [courseId]
    );

    return completedImagesCount[0]['COUNT(id)'];
  } catch (error) {
    console.error(error);
    throw error;
  }
}

async function countPublishedImages(courseId) {
  try {
    const publishedImagesCount = await sql.queryFirstRow(
      "SELECT COUNT(id) FROM at_image WHERE course_id=? AND pushed_to_canvas=1",
      [courseId]
    );

    return publishedImagesCount[0]['COUNT(id)'];
  } catch (error) {
    console.error(error);
    throw error;
  }
}

async function countAdvancedImages(courseId) {
  try {
    const advancedImagesCount = await sql.queryFirstRow(
      "SELECT COUNT(id) FROM at_image WHERE course_id=? AND advanced_type IS NOT NULL AND pushed_to_canvas=0",
      [courseId]
    );

    return advancedImagesCount[0]['COUNT(id)'];
  } catch (error) {
    console.error(error);
    throw error;
  }
}

async function countAvailableImages(courseId) {
  try {
    const availableImagesCount = await sql.queryFirstRow(
      "SELECT COUNT(id) FROM at_image WHERE course_id=? AND editor!=0 AND pushed_to_canvas=0",
      [courseId]
    );

    return availableImagesCount[0]['COUNT(id)'];
  } catch (error) {
    console.error(error);
    throw error;
  }
}

async function createUser(lmsId, displayName) {
  try {
    await sql.createData('at_user', {
      created_at: new Date(),
      lms_id: lmsId,
      display_name: displayName,
      images_completed: 0
    });
  } catch (error) {
    console.error(error);
    throw error;
  }
}

async function createCourse(courseId, courseName) {
  try {
    await sql.createData('at_course', {
      id: courseId,
      course_name: courseName
    });
  } catch (error) {
    console.error(error);
    throw error;
  }
}

async function resetImage(imageId) {
  try {
    const updateQuery = process.env.DEV === 'true'
      ? "UPDATE at_image SET editor=NULL WHERE id=?"
      : "UPDATE at_image SET editor=0 WHERE id=?";

    await sql.queryFirstRow(updateQuery, [imageId]);
  } catch (error) {
    console.error(error);
    throw error;
  }
}

async function getImageInfo(imageId) {
  try {
    const image = await sql.queryFirstRow(
      "SELECT course_id, lms_id FROM at_image WHERE id=?",
      [imageId]
    );

    return image;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

async function markImageAsAdvanced(imageId, advancedType) {
  try {
    await sql.queryFirstRow(
      "UPDATE at_image SET advanced_type=?, editor=NULL WHERE id=?",
      [advancedType, imageId]
    );
  } catch (error) {
    console.error(error);
    throw error;
  }
}

async function markImageAsUnusable(imageId) {
  try {
    const courseInfo = await sql.queryFirstRow(
      "SELECT course_id, canvas_page, image_name, assignment_url, topic_url FROM at_image WHERE id=?",
      [imageId]
    );

    const courseName = await sql.queryFirstRow(
      "SELECT course_name FROM at_course WHERE id=?",
      [courseInfo[0]['course_id']]
    );

    courseInfo[0]['course_name'] = courseName['course_name'];
    courseInfo[0]['mark_as_unusable'] = true;

    if (courseInfo[0]['canvas_page'] !== '') {
      const canvasPages = courseInfo[0]['canvas_page'].split(';');
      courseInfo[0]['canvas_page'] = canvasPages[0];
    } else if (courseInfo[0]['assignment_url'] !== '') {
      const canvasPages = courseInfo[0]['assignment_url'].split(';');
      courseInfo[0]['canvas_page'] = canvasPages[0];
    } else if (courseInfo[0]['topic_url'] !== '') {
      const canvasPages = courseInfo[0]['topic_url'].split(';');
      courseInfo[0]['canvas_page'] = canvasPages[0];
    }

    courseInfo[0]['action'] = 'updateMondayBoard';

    // URL of the API or endpoint you want to send the POST request to
    const url = 'https://apswgda2p5.execute-api.us-east-1.amazonaws.com/default/getData';

    // Data to be sent in the POST request (as a JSON string)
    const data = JSON.stringify(courseInfo[0]);

    // Send POST request using axios
    const response = await axios.post(url, data);

    await sql.queryFirstRow(
      "UPDATE at_course SET needs_conversion = 1 WHERE id=?",
      [courseInfo[0]['course_id']]
    );

    await sql.queryFirstRow(
      "DELETE FROM at_image WHERE id=?",
      [imageId]
    );

    const imagesCount = await sql.queryFirstRow(
      "SELECT * FROM at_image WHERE course_id=? AND pushed_to_canvas != 1",
      [courseInfo[0]['course_id']]
    );

    if (imagesCount.length === 0) {
      const data = { course_id: courseInfo[0]['course_id'], action: 'updateMondayBoard', needs_conversion: true };

      // Send POST request for the second case
      await axios.post(url, data);

      await sql.queryFirstRow(
        "UPDATE at_course SET needs_conversion = 0 WHERE id=?",
        [courseInfo[0]['course_id']]
      );
    }

    return courseInfo[0]['course_id'];
  } catch (error) {
    console.error(error);
    throw error;
  }
}

async function setPushedToCanvas(imageId) {
    try {
      await sql.queryFirstRow(
        "UPDATE at_image SET pushed_to_canvas=true WHERE id=?",
        [imageId]
      );
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
  
  async function incrementImagesCompleted(userId) {
    try {
      const oldValResult = await sql.queryFirstRow(
        "SELECT images_completed FROM at_user WHERE id=?",
        [userId]
      );
  
      const oldVal = oldValResult['images_completed'] || 0;
      const newVal = oldVal + 1;
  
      await sql.queryFirstRow(
        "UPDATE at_user SET images_completed=? WHERE id=?",
        [newVal, userId]
      );
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
  
  // Canvas API functions
  async function getCourseImages(courseId) {
    try {
      const files = await canvas_service.curlGet(`courses/${courseId}/files`);
  
      if (!files) {
        return {
          error: true,
          message: 'Course does not contain any images',
        };
      } else if (files.errors) {
        return {
          error: true,
          message: `Canvas error: ${files.errors[0].message}`,
        };
      }
  
      const images = files
        .filter((file) => file.mime_class === 'image')
        .map((file) => ({
          lmsId: file.id,
          courseId: courseId,
          url: file.url,
        }));
  
      const imagesInUse = await findCourseImages(images, courseId);
  
      return imagesInUse;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

function replaceImages(body, image, courseId) {
    const id = image.lms_id;
  
    // Extract each image tag that contains a link to the image and update it as needed
    const search = new RegExp(`(?<=)(?:[^<>]+courses/${courseId}/files/${id}[^<>]+)(?=/?>)`, 'g');
    const fileNameSearch =  /alt=['"]([^'"]*)['"]/i;
    const matches = body.match(search);
    const isDecorative = image.is_decorative;
    const altText = isDecorative ? '' : image.alt_text;
  
    if (matches) {
      matches.forEach(match => {
        if (!match.includes('alt=')) {
          body = body.replace(
            new RegExp(`(https://usu.instructure.com/courses/${courseId}/files/${id}.*?")`),
            (_, group1) => `${group1} alt="${isDecorative ? '' : altText}"`
          );
        } else {
          const fileNameMatches = match.match(fileNameSearch);
          if (fileNameMatches) {
            body = body.replace(
              new RegExp(`(https://usu.instructure.com/courses/${courseId}/files/${id}.*?)alt=['"].*?['"]`),
              (_, group1) => `${group1} alt="${isDecorative ? '' : altText}"`
            );
          }
        }
      });
    }
  
    setPushedToCanvas(image.id);
    return body;
}

async function updatePage(courseId, pageUrl, body) {
  try {
    // Use the canvasService.curlPut function to perform the PUT request
    const apiUrl = `courses/${courseId}/pages/${pageUrl}`;
    const data = { 'wiki_page[body]': body };
    
    const response = await canvas_service.curlPut(apiUrl, data);

    // Handle the response as needed
    console.log('Page updated successfully:', response.data);
  } catch (error) {
    // Handle errors
    console.error('Error updating page:', error.message);
  }
}

// Update Assignment Description
async function updateAssignment(courseId, assignmentId, body) {
    const data = { 'assignment[description]': body };
    await canvas_service.curlPut(`courses/${courseId}/assignments/${assignmentId}`, data);
}
  
// Update Discussion Message
async function updateDiscussion(courseId, discussionId, body) {
    const data = { message: body };
    await canvas_service.curlPut(`courses/${courseId}/discussion_topics/${discussionId}`, data);
}
  
// Update Quiz Description
async function updateQuizDescription(courseId, quizId, body) {
    const data = { 'quiz[description]': body };
    await canvas_service.curlPut(`courses/${courseId}/quizzes/${quizId}`, data);
}

async function updateCourseImages(images) {
    const courseId = images[0].course_id;
    let pushedImages = 0;
  
    for (const image of images) {
      const imageId = image.lms_id;
  
      const canvasPage = await getCanvasPage(imageId);
      if (canvasPage && canvasPage[0].canvas_page !== "") {
        const canvasPageUrl = canvasPage[0].canvas_page;
  
        const delimiter = ";";
        const pageArray = canvasPageUrl.split(delimiter);
        const mainUrl = pageArray[0];
  
        const delimiter1 = "/";
        const mainArray = mainUrl.split(delimiter1);
        const prefix = mainArray.slice(0, -1).join("/");
  
        for (const element of pageArray) {
          let canvasPageUrl = "";
  
          if (element === mainUrl) {
            canvasPageUrl = mainUrl;
          } else {
            canvasPageUrl = `${prefix}/${element}`;
          }
  
          const response = await canvas_service.curlGet(canvasPageUrl);
  
          if (response.errors) {
            const message = response.errors[0].message;
            if (message === "The specified resource does not exist.") {
              continue;
            }
            return -1;
          }
  
          let body = response.body;
          const oldBody = body;
          body = replaceImages(body, image, courseId);
          if (body !== oldBody) {
            pushedImages++;
          }
  
          const url = canvasPageUrl.split("/").pop();
          await updatePage(courseId, url, body);
        }
      }
  
      const assignmentPage = await getAssignmentPage(imageId);
      if (assignmentPage && assignmentPage[0].assignment_url !== "") {
        const assignmentPageUrl = assignmentPage[0].assignment_url;
  
        const delimiter = ";";
        const pageArray = assignmentPageUrl.split(delimiter);
        const mainUrl = pageArray[0];
  
        const delimiter1 = "/";
        const mainArray = mainUrl.split(delimiter1);
        const prefix = mainArray.slice(0, -1).join("/");
  
        for (const element of pageArray) {
          let assignmentPageUrl = "";
  
          if (element === mainUrl) {
            assignmentPageUrl = mainUrl;
          } else {
            assignmentPageUrl = `${prefix}/${element}`;
          }
  
          const response = await canvas_service.curlGet(assignmentPageUrl);
  
          if (response.errors) {
            const message = response.errors[0].message;
            if (message === "The specified resource does not exist.") {
              continue;
            }
            return -1;
          }
  
          let body = response.description;
          const oldBody = body;
          body = replaceImages(body, image, courseId);
          if (body !== oldBody) {
            pushedImages++;
          }
  
          const url = assignmentPageUrl.split("/").pop();
          await updateAssignment(courseId, url, body);
        }
      }
  
      const topicPage = await getTopicPage(imageId);
      if (topicPage && topicPage[0].topic_url !== "") {
        const topicPageUrl = topicPage[0].topic_url;
  
        const delimiter = ";";
        const pageArray = topicPageUrl.split(delimiter);
        const mainUrl = pageArray[0];
  
        const delimiter1 = "/";
        const mainArray = mainUrl.split(delimiter1);
        const prefix = mainArray.slice(0, -1).join("/");
  
        for (const element of pageArray) {
          let topicPageUrl = "";
  
          if (element === mainUrl) {
            topicPageUrl = mainUrl;
          } else {
            topicPageUrl = `${prefix}/${element}`;
          }
  
          const response = await canvas_service.curlGet(topicPageUrl);
  
          if (response.errors) {
            const message = response.errors[0].message;
            if (message === "The specified resource does not exist.") {
              continue;
            }
            return -1;
          }
  
          let body = response.message;
          const oldBody = body;
          body = replaceImages(body, image, courseId);
          if (body !== oldBody) {
            pushedImages++;
          }
  
          const url = topicPageUrl.split("/").pop();
          await updateDiscussion(courseId, url, body);
        }
      }
    }
  
    return pushedImages;
}

async function findUsagePages(imageId) {
    const foundUrls = [];
  
    const canvasPage = await getCanvasPage(imageId);
    if (canvasPage && canvasPage[0].canvas_page !== "") {
      foundUrls.push(canvasPage[0].canvas_page);
    }
  
    const assignmentPage = await getAssignmentPage(imageId);
    if (assignmentPage && assignmentPage[0].assignment_url !== "") {
      foundUrls.push(assignmentPage[0].assignment_url);
    }
  
    const discussionsPage = await getTopicPage(imageId);
    if (discussionsPage && discussionsPage[0].topic_url !== "") {
      foundUrls.push(discussionsPage[0].topic_url);
    }
  
    return foundUrls;
}

async function getBody(url) {
    let body;
  
    if (url.includes('pages')) {
      if (url.includes(';')) {
        const urls = url.split(';');
        body = (await canvas_service.curlGet(urls[0])).body;
      } else {
        body = (await canvas_service.curlGet(url)).body;
      }
    } else if (url.includes('assignments')) {
      if (url.includes(';')) {
        const urls = url.split(';');
        body = (await canvas_service.curlGet(urls[0])).description;
      } else {
        body = (await canvas_service.curlGet(url)).description;
      }
    } else if (url.includes('discussion_topics')) {
      if (url.includes(';')) {
        const urls = url.split(';');
        body = (await canvas_service.curlGet(urls[0])).message;
      } else {
        body = (await canvas_service.curlGet(url)).message;
      }
    } else {
      body = "<p>Invalid URL.</p>";
    }
  
    return body;
}

async function getCourseNameCanvas(courseId) {
    try {
      const name = (await canvas_service.curlGet(`courses/${courseId}`)).name;
      return name;
    } catch (error) {
      console.error('Error:', error.message);
      return null;
    }
}

async function updateAltText(imageUrl, newAltText, isDecorative) {
    const query = 'UPDATE at_image SET alt_text=?, is_decorative=? WHERE image_url=?';
    await sql.queryFirstRow(query, [newAltText, isDecorative, imageUrl]);
    return { imageUrl: imageUrl, newAltText: newAltText };
}
  
async function altTextUpdatedUser(imageUrl, newUser) {
    const query = 'UPDATE at_image SET alttext_updated_user=? WHERE image_url=?';
    await sql.queryFirstRow(query, [newUser, imageUrl]);
    return { imageUrl: imageUrl, newUser: newUser };
}
  
async function insertAltTextUser(imageUrl, username, userUrl, email) {
    const query = 'INSERT INTO at_alt_text (image_url, alttext_updated_user, user_url, email) VALUES (?, ?, ?, ?)';
    await sql.queryFirstRow(query, [imageUrl, username, userUrl, email]);
}
  

async function findCourseImages(images, courseId) {
    let imagesInUse = [];
  
    // Find images used in pages
    const pages = await canvas_service.curlGet(`courses/${courseId}/pages`);
    if (pages !== null) {
      for (const page of pages) {
        const bodyUrl = page.html_url.replace('https://usu.instructure.com/', '');
        const response = await canvas_service.curlGet(bodyUrl);
        const body = response.body;
        const newImages = await findUsedImages(images, body, courseId, imagesInUse, bodyUrl, 'pages');
        imagesInUse = imagesInUse.concat(newImages);
      }
    }
  
    // Find images used in assignments (including quizzes)
    const assignments = await canvas_service.curlGet(`courses/${courseId}/assignments`);
    if (assignments !== null) {
      for (const assignment of assignments) {
        if (!assignment.is_quiz_assignment) {
          const body = assignment.description;
          const url = assignment.html_url.replace('https://usu.instructure.com/', '');
          const newImages = await findUsedImages(images, body, courseId, imagesInUse, url, 'assignment');
          imagesInUse = imagesInUse.concat(newImages);
        }
      }
    }
  
    // Find images used in discussions
    const discussions = await canvas_service.curlGet(`courses/${courseId}/discussion_topics`);
    if (discussions !== null) {
      for (const discussion of discussions) {
        const body = discussion.message;
        const url = discussion.html_url.replace('https://usu.instructure.com/', '');
        const newImages = await findUsedImages(images, body, courseId, imagesInUse, url, 'discussion');
        imagesInUse = imagesInUse.concat(newImages);
      }
    }
  
    return imagesInUse;
}


async function findUsedImages(images, body, courseId, imagesInUse, value, type) {
  if (body === '') {
    return [];
  }

  const newImages = [];
  for (const image of images) {
    const id = image.lmsId;

    // Extract each image tag that contains a link to the image
    const search = new RegExp(`(?<=)(?:[^< >]+courses/${courseId}/files/${id}[^< >]+)(?=<\\/?>)`, 'g');
    const fileNameSearch = /alt=["']([^"']+\.((jpeg|jpg|jpe|jif|jfif|jfi|png|gif|webp|tiff|tif|psd|raw|bmp|dib|heif|heic|ind|indd|indt|svg|svgz|ai|eps)\s*\.?))["']/i;

    const matches = body.match(search);
    if (matches) {
      let needsAltText = false;

      for (const match of matches) {
        if (!match.includes('alt=') || match.includes('alt=""') || fileNameSearch.test(match) || match.includes('alt="Uploaded Image"')) {
          needsAltText = true;
          break;
        }
      }

      if (needsAltText && !imageInArray(image, newImages) && !imageInArray(image, imagesInUse)) {
        if (type === 'pages') {
          image.canvas_page = value || '';
        } else if (type === 'assignment') {
          image.assignment_url = value || '';
        } else if (type === 'discussion') {
          image.topic_url = value || '';
        }

        imagesInUse.push(image);
      } else if (imageInArray(image, imagesInUse)) {
        if (type === 'pages') {
          for (const element of imagesInUse) {
            if (element.url === image.url && 'canvas_page' in element) {
              if (element.canvas_page === '') {
                element.canvas_page = value || '';
              } else {
                const delimiter = '/';
                const array = (value || '').split(delimiter);
                const page = array[array.length - 1];
                element.canvas_page = `${element.canvas_page};${page}`;
              }
            }
          }
        } else if (type === 'assignment') {
          for (const element of imagesInUse) {
            if (element.url === image.url && 'assignment_url' in element) {
              if (element.assignment_url === '') {
                element.assignment_url = value || '';
              } else {
                const delimiter = '/';
                const array = (value || '').split(delimiter);
                const page = array[array.length - 1];
                element.assignment_url = `${element.assignment_url};${page}`;
              }
            }
          }
        } else if (type === 'discussion') {
          for (const element of imagesInUse) {
            if (element.url === image.url && 'topic_url' in element) {
              if (element.topic_url === '') {
                element.topic_url = value || '';
              } else {
                const delimiter = '/';
                const array = (value || '').split(delimiter);
                const page = array[array.length - 1];
                element.topic_url = `${element.topic_url};${page}`;
              }
            }
          }
        }
      }
    }
  }

  return imagesInUse;
}

function imageInArray(image, imageArray) {
    for (const element of imageArray) {
      if (element.url === image.url) {
        return true;
      }
    }  
    return false;
}

function imageInBody(courseId, imageId, body) {
    if (body === "") {
      return false;
    }
  
    const search = new RegExp(`(?<=)(?:[^<>]+courses\\/${courseId}\\/files\\/${imageId}[^<>]+)(?=<\\/?>)`);
    return search.test(body);
}

// Validation functions
function validateImageId(imageId) {
    if (!/^[0-9]*$/.test(imageId) || parseInt(imageId) <= 0) {
        const data = {
            error: true,
            message: 'invalid request body',
        };

        return data;
    } else if (!Action.imageExists(imageId)) {
        const data = {
            error: true,
            message: 'image not found',
        };
        
        return data;
    }
}

function validateUserId(userId) {
    if (!/^[0-9]*$/.test(userId) || parseInt(userId) <= 0) {
        const data = {
            error: true,
            no_images: false,
            message: 'invalid user id',
        };

        return data;
    }

    if (!Action.userExists(userId)) {
        const data = {
            error: true,
            no_images: false,
            message: 'user not found',
        };

        return data
    }
}

function validateCourseId(courseId) {
    if (!/^[0-9]{6}$/.test(courseId)) {
        const data = {
            error: true,
            message: 'invalid course id',
        };

        return data;
    }
}

// function validateAdvancedType(advancedType) {
//     // Assuming you have the array of advanced types available
//     const ADVANCED_TYPES = [...]; // Replace with your actual array

//     if (!ADVANCED_TYPES.includes(advancedType)) {
//         const data = {
//             error: true,
//             message: 'invalid advanced type',
//         };
//         Action.jsonResponse(data);
//         process.exit();
//     }
// }