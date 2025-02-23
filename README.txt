TODO List

Author: York Yuan (yuan0402@umn.edu)

Setup Instructions
1,Install Dependencies Use npm to install all required packages:
  npm install express mysql2 bcrypt express-session pug

2,Set Up MySQL Database:
  CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL
);

CREATE TABLE todos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status ENUM('done', 'not done') DEFAULT 'not done',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_id INT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE comments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    todo_id INT NOT NULL,
    text TEXT NOT NULL,
    FOREIGN KEY (todo_id) REFERENCES todos(id) ON DELETE CASCADE
);

3,Update Database Credentials Open server.js and update the following configuration to match your MySQL credentials:
const dbConfig = {
  host: 'cse-mysql-classes-01.cse.umn.edu',
  user: 'C4131F24S002U65',
  password: '4275',
  database: 'C4131F24S002U65',
};

4,Start the Server Run the application using the following command:
  node server.js

5,Access the Application Open your web browser and visit the following URL:
  http://localhost:3618/login.html

Core Features:

TODO List Management
    View a list of all your TODO tasks.
    Filter tasks by status: All, Done, and Not Done.
    Use the "Add TODO" option to create a new task.
    View Task Details

Logout
    Log out securely using the "Logout" button.

Features Implemented:

Click on a TODO title to see its details, including:
    Editable description
    Comments list
    Modify the task description directly in the details view.

Manage Comments
    Add comments for a task using the provided input form.
    Delete any comment using the Delete button.

User Authentication
    Users can create accounts and log in.
    Passwords are securely hashed and stored in the database.

Data Protection
    Users can only access and manage their own tasks and comments.
    Unauthorized users are redirected to the login page.


Notes
    The username and password for test:
    {1111, 2222}, {york, 1111}