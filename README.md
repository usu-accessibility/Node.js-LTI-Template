# Alt Text App

## Starting the Dev Server
To start the dev server, first set the DEV environment variable to "true" in the .env file. Then navigate to the root directory and run the following command: `php -S localhost:8000`

## Overview

The Alternative Text Tool is a powerful solution for adding alternative text (alt text) to the vast number of images used in canvas courses. This tool has been designed to streamline the process of making course materials more accessible by providing alt text for images. With the ability to identify images without alt text and enabling users to validate and enhance alt text descriptions, this tool ensures that course content is inclusive and accessible to all learners.

The key features of the Alternative Text Tool include:

- Automated identification of images without alt text.
- Descriptive alt text input.
- Marking images as "decorative."
- Flagging complex images for human review.
- User validation of alt text descriptions for accuracy.
- Seamless integration with Canvas LMS for publishing alt text back to course materials.
- Scalability, allowing for the management of over thousands of images per semester.

## Technology Stack

The Alternative Text Tool is built using the following technologies:

- **Frontend**: React.js
- **Backend**: Node.js (formerly PHP)
- **Database**: AWS RDS for storing course and image data (formerly phpMyAdmin)
- **Integration**: Canvas LMS API for accessing course images through API calls
- **Integration**: Integration with Monday board using AWS Lambda functions
- **User Management**: Automatic daily reset of course assignments for users

![Projects - Page 1-2](https://github.com/Dheeraj0650/AltTextApplication/assets/41461773/3265171d-523f-4026-8bc0-c1c5ec2e57ee)


## Workflow

The workflow of the Alternative Text Tool consists of the following four main pages:

1. **Home Page**: This is the main dashboard where users can view images on the left and the associated course page on the right. Users can filter courses and add alt text, mark images as advanced, or skip them.
   
![Screenshot 2023-10-23 at 5 08 05 PM](https://github.com/usu-accessibility/AltTextApp/assets/41461773/61772411-df12-4329-b5cd-62d05e55b760) 

![Screenshot 2023-10-23 at 5 08 15 PM](https://github.com/usu-accessibility/AltTextApp/assets/41461773/cf6342dd-c2b3-4130-8a84-f0d8dc96a6d1)


3. **Advanced Images Page**: Here, more expert users can add alt text to complex images or put them on hold for further review.
   
![Screenshot 2023-10-23 at 5 08 44 PM](https://github.com/usu-accessibility/AltTextApp/assets/41461773/82456c21-24ce-41c0-a6f1-2ce3a6791e45)

5. **Load Images Page**: Users load course images into the Alternative Text Tool using the course ID and we can also load images from monday board by changing the status tag to "Load Images".
   
![Screenshot 2023-10-23 at 5 08 53 PM](https://github.com/usu-accessibility/AltTextApp/assets/41461773/698a7554-0ed1-4d2b-9bc0-7d7a5e87371f)

![Screenshot 2023-10-23 at 5 16 58 PM](https://github.com/usu-accessibility/AltTextApp/assets/41461773/2934b11a-37be-412f-a5b7-ed311f1976b1)

7. **Review & Publish Page**: Admins can review the alt text added by users and publish it back to the Canvas course.
   
![Screenshot 2023-10-23 at 5 09 19 PM](https://github.com/usu-accessibility/AltTextApp/assets/41461773/aad31345-17e6-4211-bbfb-58498d4fce7b)

![Screenshot 2023-10-23 at 5 09 55 PM](https://github.com/usu-accessibility/AltTextApp/assets/41461773/94aa3fb6-c6a5-4aa2-955d-03a80f066969)



## Future Enhancements

The Alternative Text Tool is an ongoing project, and we have plans to add more features to improve its functionality and usability. Some of the upcoming features include:

- Sending notifications to users who enter incorrect alt text for an image.
- Implementing a dashboard to visualize the progress of the alt text application using charts and graphs.

We are committed to continuously enhancing the tool to make educational content more inclusive and accessible.

## Getting Started

To get started with the Alternative Text Tool, follow these steps:

1. Clone the repository.
2. To install the project dependencies, run **npm install**
3. To create build file, run **npm run build**
4. Copy the entire folder to elearn server.
5. Look at the API documentation below for the backend API details

For detailed instructions on setting up and using the tool, please refer to the project's documentation.

## Contributors

This project was developed by Digital Accessibility Specialist with contributions from [List of Contributors].

## License

This project is licensed under the [License Name] - see the [LICENSE.md](LICENSE.md) file for details.

We hope that the Alternative Text Tool proves to be a valuable resource for making educational content more accessible and inclusive. Your feedback and contributions are greatly appreciated. Thank you for using our tool!


## API Documentation
### Get An Image
    GET task.php?task=get_image

This endpoint finds the next image in the queue, assigns the current user as the editor, and returns the image information. If the user is already assigned to an image that is not completed, the information for that image is returned. The current user is identified by their php session.

#### Response

The response body will contain the following json if the operation is successful:

    {
        image_id: {integer},
        url: {string}
    }

#### Errors
If there are no images in the queue, the response body will contain the following json:

    {
        error: true, 
        no_images: true,
        message: "no images in queue"
    }

If the user does not exist, the response body will contain the following json:

    {
        error: true,
        no_images: false,
        message: "user not found"
    }


### Set Image As Completed
    POST task.php?task=set_image_completed

This endpoint finds the images with the given id in the database and updates the images `alt_text`, `is_decorative`, and `completed_at` columns.

The request body must contain json data in the following form:

    {
        image_id: {integer},
        alt_text: {string},
        is_decorative: {boolean},
    }

If `is_decorative` is set to true, the `alt_text` parameter should be either null or an empty string.

#### Response

The response body will contain the following json if the operation is successful:

    {
        image_id: {integer},
        alt_text: {string},
        is_decorative: {boolean},
        date_completed: {datetime}
    }

#### Errors
If the image does not exist, the response body will contain the following json:

    {
        error: true,
        message: "image not found"
    }

If the image is already completed, the response body will contain the following json:

    {
        error: true,
        message: "image is already completed"
    }

If the image id is not an integer greater than 0, the response body will contain the following json:

    {
        error: true,
        message: "invalid image id"
    }

If the request body is invalid, the response body will contain the following json:

    {
        error: true,
        message: "invalid request body"
    }


### Load Images
    POST task.php?task=load_images

This endpoint searches the canvas course with the given id for images that are in use and that don't have alt text. These images are then loaded into the database and queued for users to add alt text to them.

The request body must contain json data in the following form:

    {
        course_id: {integer}
    }

#### Response

The response body will contain the following json if the operation is successful:

    {
        images_added: {integer}
    }

#### Errors
If images are found that already exist in the database, the response body will contain the following json:

    {
        message: "{integer} image(s) were found that are already in the database"
    }

If canvas returns an error while checking the course files or pages, the response body will contain the following json:

    {
        error: true,
        message: "Canvas error: {canvas error message}"
    }

If the course id is not an integer greater than 0, the response body will contain the following json:

    {
        error: true,
        message: "invalid course id"
    }

If the request body is invalid, the response body will contain the following json:

    {
        error: true,
        message: "invalid request body"
    }


### Push Images
    POST task.php?task=push_images

This endpoint pushes the alt text for all the completed images to canvas. It also markes that the images have been pushed to canvas so that they aren't pushed multiple times.

#### Response

The response body will contain the following json if the operation is successful:

    {
        'pushed_images': {integer},
    }

#### Errors
If there are no completed image in the database that have not already been pushed to canvas, the response body will contain the following json:

    {
        pushed_images: 0,
        message: "There are no images that are ready to be pushed back to canvas"
    }

If an error is received from canvas while pushing the alt text to canvas, the response body will contain the following json:

    {
        pushed_images: {integer},
        failed_image_ids: {comma delimited list of failed course ids},
        message: "images failing to push is usually caused by the course no longer existing in canvas"
    }
