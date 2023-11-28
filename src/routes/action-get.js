const action = require('../controllers/main-controller');
const sql = require('../services/sql-service');

module.exports = function(router, session){

    router.get('/', async (req, res) => {
        return res.json(getHealth());
    });

    router.get('/get_user_details', async (req, res) => {
    const userdetails = {
        username: session.canvas_data.name_given,
        userimage: session.canvas_data.user_image,
        role: session.canvas_data.role
    };

    return res.json(userdetails);
    });

    router.get('/get_active_courses', async (req, res) => {
        const user = await action.getUserByLmsId(session.canvas_data.userID);
        console.log("hello world");
        console.log(user);
        if (user.success) {
            const userId = user.user_id;

            const advancedType = req.query.advanced_type || "";

            const courses = [];
            const courseList = await action.getActiveCourses(userId, advancedType);

            for(var idx = 0; idx < courseList.length; idx++){
                var element = courseList[idx];
                const courseId = element.course_id;
                const courseName = await action.getCourseName(courseId);
                courses.push({ id: courseId, course_name: courseName });
                console.log({ id: courseId, course_name: courseName })
            }

            // await courseList.forEach(async (element) => {
            //     const courseId = element.course_id;
            //     const courseName = await action.getCourseName(courseId);
            //     courses.push({ id: courseId, course_name: courseName });
            //     console.log({ id: courseId, course_name: courseName })
            // });

            console.log("value");
            console.log(courses);
            return res.json(courses);
        } else {
            const data = {
                error: true,
                no_images: false,
                message: 'lms id does not exist',
            };

            return res.json(data);
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
        const user = await action.getUserByLmsId(session.canvas_data.userID); // Assuming session data is available

        console.log("update_course_id");
        console.log(user);
        console.log(req.query.lock);
        console.log(req.query.lock !== null)
        if (user.success) {
            const userId = user.user_id;

            if (req.query.lock !== null) {
                const editorValue = await sql.queryFirstRow(
                    "SELECT editor FROM at_image WHERE id = ?",
                    [req.query.image_id]
                );

                console.log(editorValue)
                console.log(editorValue[0].editor !== userId)
                console.log(editorValue[0].editor !== 0)

                if (editorValue.length !== 0 && editorValue[0].editor !== 0 && editorValue[0].editor !== userId) {
                    const data = {
                        error: "Image has been locked by another user. Loading next image.",
                    };
                    return res.json(data);
                } else {
                    console.log(userId + " " + req.query.image_id + " " + req.query.lock)
                    var result = await action.updateEditorId(userId, req.query.image_id, req.query.lock);

                    // Assuming you want to perform a task after updating the editor ID
                    // const result = performTask(/* pass relevant value */);

                    if (result) {
                        return res.json({ success: true });
                    } else {
                        return res.json({ error: "Task timed out." });
                    }
                }
            }
        } else {
            const data = {
                error: true,
                no_images: false,
                message: 'lms id does not exist',
            };
            return res.json(data);
        }
    });

    router.get('/get_lock_status', async (req, res) => {
        const user = await action.getUserByLmsId(session.canvas_data.userID); // Assuming session data is available

        if (user.success) {
            const userId = user.user_id;

            // Assuming you want to get image_id from the request parameters
            const imageId = req.query.image_id;

            const data = await action.getLockStatus(userId, imageId);

            // Send the lock status as a JSON response
            return res.json({
                locked: data.length === 0 ? false : data[0].editor == userId,
            });
        } else {
            const data = {
                error: true,
                no_images: false,
                message: 'lms id does not exist',
            };
            return res.json(data);
        }
    });

    router.get('/get_image', async (req, res) => {
        const user = await action.getUserByLmsId(session.canvas_data.userID); // Assuming session data is available

        if (user.success) {
            const userId = user.user_id;

            var validateUserId = await action.validateUserId(userId);
            
            if(validateUserId !== null){
                return res.json(validateUserId);
            }

            const selectedCourseId = req.query.selectedCourse || 0;

            var image;

            if (req.query.advanced_type) {
                var isValidateAdvancedType = await action.validateAdvancedType(req.query.advanced_type);

                if(isValidateAdvancedType !== null){
                    return res.json(isValidateAdvancedType);
                }

                console.log("advenced types");
                console.log(req.query.advanced_type);

                image = await action.getAdvancedImage(req.query.advanced_type, selectedCourseId, userId, session);
            } else {
                image = await action.getImage(selectedCourseId, userId, session);
            }

            if (image.length === 0) {
                const data = {
                    error: true,
                    no_images: true,
                    message: 'no images in queue',
                };
                return res.json(data);
            } else {
                const courseName = await action.getCourseName(image[0].course_id);

                const data = {
                    image_id: image[0].id,
                    url: image[0].image_url,
                    course_name: courseName,
                    image_name: image[0].image_name,
                };

                return res.json(data);
            }
        } else {
            const data = {
                error: true,
                no_images: false,
                message: 'lms id does not exist',
            };
            return res.json(data);
        }
    });

    router.get('/get_courses_info', async (req, res) => {
        const courseIds = await action.getCourseIds();
        const data = [];

        for(var idx = 0; idx < 100; idx++){
            var courseId = courseIds[idx];
            const courseName = await action.getCourseName(courseId);
            const totalImages = await action.countTotalImages(courseId);
            const completedImages = await action.countCompletedImages(courseId);
            const publishedImages = await action.countPublishedImages(courseId);
            const advancedImages = await action.countAdvancedImages(courseId);
            const availableImages = await action.countAvailableImages(courseId);

            console.log(idx + " " + courseIds.length);

            data.push({
                id: courseId,
                name: courseName,
                total_images: totalImages,
                completed_images: completedImages,
                published_images: publishedImages,
                advanced_images: advancedImages,
                available_images: availableImages,
            });
        }

        // courseIds.forEach((courseId) => {
        //     const courseName = await action.getCourseName(courseId);
        //     const totalImages = await action.countTotalImages(courseId);
        //     const completedImages = await action.countCompletedImages(courseId);
        //     const publishedImages = await action.countPublishedImages(courseId);
        //     const advancedImages = await action.countAdvancedImages(courseId);
        //     const availableImages = await action.countAvailableImages(courseId);

        //     data.push({
        //         id: courseId,
        //         name: courseName,
        //         total_images: totalImages,
        //         completed_images: completedImages,
        //         published_images: publishedImages,
        //         advanced_images: advancedImages,
        //         available_images: availableImages,
        //     });
        // });w

        // Send the data as a JSON response
        console.log(data);
        return res.json(data);
    });

    router.get('/get_completed_images', async (req, res) => {
        const courseId = req.query.course_id;

        if (courseId) {
            const completedImages = await action.getCourseCompletedImages(courseId);

            if (completedImages === null) {
                const data = {
                    message: 'There are no completed images for this course',
                };
                return res.json(data);
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
                return res.json(data);
            }
        } else {
            const data = {
                error: true,
                message: 'course_id not set',
            };
            return res.json(data);
        }
    });

    router.get('/get_image_usage', async (req, res) => {
        if (req.query.image_id) {
            const imageId = req.query.image_id;

            try {
                await action.validateImageId(imageId);

                const image = await action.getImageInfo(imageId);
                const courseId = image[0].course_id;
                const imageLmsId = image[0].lms_id;

                const foundPageIds = await action.findUsagePages(imageLmsId, courseId);

                const data = {
                    image_id: imageLmsId,
                    course_id: courseId,
                    pages: foundPageIds.join(', '),
                };

                // Send the data as a JSON response
                return res.json(data);
            } catch (error) {
                const data = {
                    error: true,
                    message: error.message,
                };

                return res.json(data);
            }
        } else {
            const data = {
                error: true,
                message: 'invalid parameters',
            };

            return res.json(data);
        }
    });

    router.get('/get_body', async (req, res) => {
        if (req.query.page_url) {
            const pageUrl = req.query.page_url;
            const body = await action.getBody(pageUrl);

            // Send the body content as a JSON response
            return res.json({ body });
        } else {
            const data = {
                error: true,
                message: 'page_url not set',
            };

            return res.json(data);
        }
    });

    router.get('/count_completed_images', async (req, res) => {
        const completedImageCount = action.getCompletedImages().length;
        const data = { completed_image_count: completedImageCount };
        return res.json(data);
        });

        router.get('/is_admin', async (req, res) => {
        const isAdmin = session.at_admin || false;
        const data = { is_admin: isAdmin };
        return res.json(data);
        });

        router.get('/test', async (req, res) => {
        const testResult = action.testDb();
        const data = { test: testResult };
        return res.json(data);
    });

    router.get('/reset_test_images', async (req, res) => {
        session.skippedImages = [];
        action.resetTestImages();
        const data = { done: true };
        return res.json(data);
    });

    function getHealth() {
        return {
            ok: true,
            message: 'Healthy',
        };
    }
}
