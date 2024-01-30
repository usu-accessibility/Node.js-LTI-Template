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
}
