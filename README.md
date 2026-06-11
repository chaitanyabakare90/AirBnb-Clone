# Airbnb Clone

🚀 Live Demo: [https://your-deployed-link.com](https://airbnb-project-1dxc.onrender.com)

A full-stack Airbnb-style web application that allows users to create, manage, and explore property listings. The application supports secure user authentication, image uploads, reviews, and authorization features while following the MVC architecture for scalability and maintainability.

## Features

* User Authentication and Authorization

  * Secure signup and login using Passport.js
  * Session-based authentication
  * Protected routes for authenticated users

* Property Listings

  * Create, update, and delete listings
  * View all available listings
  * Detailed listing pages

* Image Management

  * Cloud-based image storage using Cloudinary
  * File uploads handled with Multer

* Reviews and Ratings

  * Add reviews to listings
  * Delete reviews
  * Rating system for user feedback

* Flash Messages

  * Success and error notifications using Connect-Flash

* Data Validation

  * Server-side validation using Joi
  * Prevents invalid data from being stored

* Authorization

  * Only listing owners can edit or delete their listings
  * Only review authors can delete their reviews

* MVC Architecture

  * Organized codebase with separate Models, Views, Controllers, and Routes

---

## Tech Stack

### Frontend

* HTML5
* CSS3
* Bootstrap
* EJS

### Backend

* Node.js
* Express.js

### Database

* MongoDB Atlas
* Mongoose

### Authentication

* Passport.js
* Passport Local
* Passport Local Mongoose

### Cloud Services

* Cloudinary (Image Storage)

### Validation

* Joi

### Deployment

* AWS EC2

---

## Project Structure

```text
├── controller/
├── init/
├── models/
├── public/
├── routes/
├── utils/
├── views/
├── middleware.js
├── Schema.js
├── cloudConfig.js
├── index.js
└── package.json
```

---

## Installation

### Clone the Repository

```bash
git clone https://github.com/your-username/airbnb-clone.git
cd airbnb-clone
```

### Install Dependencies

```bash
npm install
```

### Create Environment Variables

Create a `.env` file in the root directory and add:

```env
ATLASDB_URL=your_mongodb_connection_string

SECRET=your_session_secret

CLOUD_NAME=your_cloudinary_cloud_name
CLOUD_API_KEY=your_cloudinary_api_key
CLOUD_API_SECRET=your_cloudinary_api_secret
```

### Run the Application

```bash
node index.js
```

or

```bash
nodemon index.js
```

Open:

```text
http://localhost:8080
```

---

## Key Learning Outcomes

* Built RESTful APIs using Express.js
* Implemented Authentication and Authorization using Passport.js
* Integrated Cloudinary for image uploads
* Applied MVC architecture in a production-style project
* Used MongoDB Atlas for cloud database management
* Performed server-side validation using Joi
* Managed sessions and flash messages securely

---

## Future Enhancements

* Property Booking System
* Wishlist Feature
* Search and Filter Functionality
* Payment Gateway Integration
* Real-time Chat Between Hosts and Guests
* Google OAuth Authentication

---

## Author

**Chaitanya Bakare**

Computer Science Student | Full Stack Developer | Competitive Programmer

GitHub: https://github.com/chaitanyabakare90
