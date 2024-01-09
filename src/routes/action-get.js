// /**
//  * @swagger
//  * components:
//  *   schemas:
//  *     Books:
//  *       type: object
//  *       required:
//  *         - title
//  *         - description
//  *         - finished
//  *       properties:
//  *         id:
//  *           type: string
//  *           description: The auto-generated id of the book
//  *         title:
//  *           type: string
//  *           description: The title of your book
//  *         description:
//  *           type: string
//  *           description: The book explanation
//  *         published:
//  *           type: boolean
//  *           description: Whether you have finished reading the book
//  *         createdAt:
//  *           type: string
//  *           format: date
//  *           description: The date the book was added
//  *     
//  */
// /**
//  * @swagger
//  * tags:
//  *   name: Books
//  *   description: The books managing API
//  * /book:
//  *   get:
//  *     summary: Lists all the books
//  *     tags: [Books]
//  *     responses:
//  *       200:
//  *         description: The list of the books
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: array
//  *               items:
//  *                 $ref: '#/components/schemas/Books'
//  *   post:
//  *     summary: Create a new book
//  *     tags: [Books]
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             $ref: '#/components/schemas/Books'
//  *     responses:
//  *       200:
//  *         description: The created book.
//  *         content:
//  *           application/json:
//  *             schema:
//  *               $ref: '#/components/schemas/Books'
//  *       500:
//  *         description: Some server error
//  * /book/{id}:
//  *   get:
//  *     summary: Get the book by id
//  *     tags: [Books]
//  *     parameters:
//  *       - in: path
//  *         name: id
//  *         schema:
//  *           type: string
//  *         required: true
//  *         description: The book id
//  *     responses:
//  *       200:
//  *         description: The book response by id
//  *         contens:
//  *           application/json:
//  *             schema:
//  *               $ref: '#/components/schemas/Books'
//  *       404:
//  *         description: The book was not found
//  *   put:
//  *    summary: Update the book by the id
//  *    tags: [Books]
//  *    parameters:
//  *      - in: path
//  *        name: id
//  *        schema:
//  *          type: string
//  *        required: true
//  *        description: The book id
//  *    requestBody:
//  *      required: true
//  *      content:
//  *        application/json:
//  *          schema:
//  *            $ref: '#/components/schemas/Books'
//  *    responses:
//  *      200:
//  *        description: The book was updated
//  *        content:
//  *          application/json:
//  *            schema:
//  *              $ref: '#/components/schemas/Books'
//  *      404:
//  *        description: The book was not found
//  *      500:
//  *        description: Some error happened
//  *   delete:
//  *     summary: Remove the book by id
//  *     tags: [Books]
//  *     parameters:
//  *       - in: path
//  *         name: id
//  *         schema:
//  *           type: string
//  *         required: true
//  *         description: The book id
//  *
//  *     responses:
//  *       200:
//  *         description: The book was deleted
//  *       404:
//  *         description: The book was not found
//  */

const action = require('../controllers/main-controller');
const sql = require('../services/sql-service');

module.exports = function(router, session){

    router.get('/', async (req, res) => {
        try{
            return res.json(getHealth());
        }
        catch(error){
            console.log(error);
        }
    });

    router.get('/get_user_details', async (req, res) => {
        try{
            const userdetails = {
                username: session.canvas_data.name_given,
                userimage: session.canvas_data.user_image,
                role: session.canvas_data.role
            };
    
            return res.json(userdetails);
        }
        catch(error){
            console.log(error);
        }
    });

    router.get('/get_active_courses', async (req, res) => {
        try {
            const user = await action.getUserByLmsId(session.canvas_data.userID);

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
                }

                return res.json(courses);
            } else {
                const data = {
                    error: true,
                    no_images: false,
                    message: 'lms id does not exist',
                };

                return res.json(data);
            }
        }
        catch(error){
            console.log(error);
        }
    });

    router.get('/update_course_id', async (req, res) => {
        try {
            const user = await action.getUserByLmsId(session.canvas_data.userID); // Assuming session data is available

            if (user.success) {
                const userId = user.user_id;
        
                if (req.query.lock !== null) {
                    const editorValue = await sql.queryFirstRow(
                        "SELECT editor FROM at_image WHERE id = ?",
                        [req.query.image_id]
                    );

                    if (editorValue.length !== 0 && editorValue[0].editor !== 0 && editorValue[0].editor !== userId) {
                        const data = {
                            error: "Image has been locked by another user. Loading next image.",
                        };
                        return res.json(data);
                    } else {
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
        }
        catch(error){
            console.log(error);
        }
    });

    router.get('/get_lock_status', async (req, res) => {
        try {
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
        }
        catch(error){
            console.log(error);
        }
    });

    router.get('/get_image', async (req, res) => {
        try {
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
        }
        catch(error){
            console.log(error);
        }
    });

    router.get('/get_courses_info', async (req, res) => {
        try {
            let pageNumber = req.query.pageNumber;
            var results = await action.getReviewPageTableValues(pageNumber);
            return res.json(results);
        }
        catch(error){
            console.log(error);
        }        
    });

    router.get('/get_completed_images', async (req, res) => {
        try {
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
        }
        catch(error){
            console.log(error);
        }
    });

    router.get('/get_image_usage', async (req, res) => {
        try {
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
        }
        catch(error){
            console.log(error);
        }
    });

    router.get('/get_body', async (req, res) => {
        try {
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
        }
        catch(error){
            console.log(error);
        }
    });

    router.get('/count_completed_images', async (req, res) => {
        try {
            const completedImageCount = action.getCompletedImages().length;
            const data = { completed_image_count: completedImageCount };
            return res.json(data);
        }
        catch(error){
            console.log(error);
        }
    });

    router.get('/is_admin', async (req, res) => {
        try {
            const isAdmin = session.at_admin || false;
            const data = { is_admin: isAdmin };
            return res.json(data);
        }
        catch(error){
            console.log(error);
        }

    });

    router.get('/test', async (req, res) => {
        try {
            const testResult = action.testDb();
            const data = { test: testResult };
            return res.json(data);
        }
        catch(error){
            console.log(error);
        }

    });

    router.get('/reset_test_images', async (req, res) => {
        try {
            session.skippedImages = [];
            action.resetTestImages();
            const data = { done: true };
            return res.json(data);
        }
        catch(error){
            console.log(error);
        }
    });

    function getHealth() {
        return {
            ok: true,
            message: 'Healthy',
        };
    }
}
