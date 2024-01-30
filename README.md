# Node.js LTI Template

This template provides a structure for a Node.js application using LTI (Learning Tools Interoperability) with a React.js frontend. It is designed to integrate with Canvas as a course application.

## Folder Hierarchy

- **build:** Contains the static build files of the React.js application.
  
- **public:** Holds public files and the `style.css` file.
  
- **src:**
  - **constants:** Contains constant values used throughout the application.
  - **controllers:** Houses controllers responsible for handling HTTP requests.
  - **helpers:** Contains utility functions and helper modules.
  - **middlewares:** Holds middleware functions for request processing.
  - **pages:** Includes the main pages of the application.
  - **services:** Houses services that interact with external APIs or perform specific business logic.

- **.dockerignore:** Specifies files and directories to be ignored when building Docker images.

- **.env:** Configuration file for environment variables.

- **.gitignore:** Specifies files and directories to be ignored by Git.

- **index.js:** The entry point of the Node.js application.

- **template.xml:** An XML file used to add the application to Canvas as a course tool.

- **webpack.config.js:** Configuration file for Webpack, used to create the static build files.

## Getting Started

1. Clone this repository.
2. Install dependencies using `npm install`.
3. Configure environment variables in the `.env` file.
4. Run the application using `npm start`.

## Docker

To run the application in a Docker container:

1. Build the Docker image: `docker build -t your-image-name .`
2. Run the Docker container: `docker run -p 3000:3000 -d your-image-name`

## Canvas Integration

To integrate the application with Canvas as a course tool, follow the steps below:

1. Deploy the application to a server accessible by Canvas.
2. Obtain the necessary credentials and information for LTI integration.
3. Configure the application in Canvas, providing the LTI launch URL.

For detailed Canvas integration instructions, refer to the [Canvas Integration Guide](#link-to-canvas-integration-guide).

## Contributing

Contributions are welcome! If you'd like to contribute to this project, please follow the [Contributing Guidelines](CONTRIBUTING.md).

## License

This project is licensed under the [MIT License](LICENSE).
