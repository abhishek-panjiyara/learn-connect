# Learning Management System (LMS) - EduFlow

## Overview/Description

EduFlow is a web-based Learning Management System designed to facilitate online education. It provides a platform for teachers to create and manage courses, including content and assignments, and for students to enroll in courses, access learning materials, and submit their work. The system aims to offer a streamlined and intuitive experience for both educators and learners.

## Features

*   **User Authentication:**
    *   Secure user login.
    *   User registration for new students and teachers.
    *   Session management and protected routes.
*   **User Profile Management:**
    *   View and update user profile information (name, avatar).
*   **Course Management:**
    *   **Teachers:** Create new courses, update existing course details, and view courses they teach.
    *   **Students:** View courses they are currently enrolled in.
*   **Course Enrollment:**
    *   **Students:** Browse a list of available courses and enroll in them.
*   **Content Management & Viewing:**
    *   **Teachers:** Add, organize, and manage various types of course content (lessons, videos, documents). (Implicitly, based on content viewing for students and course structure)
    *   **Students:** View course content in a structured manner within enrolled courses.
*   **Assignment Management:**
    *   **Teachers:** Create and view assignments within their courses. (Implicitly, based on assignment submission for students)
    *   **Students:** View assignments for courses they are enrolled in, along with their submission status and grades.
*   **Assignment Submission:**
    *   **Students:** Submit their work for assignments, including the ability to update previous submissions. View submission status, feedback, and grades.
*   **Dashboard:**
    *   Role-specific dashboards displaying relevant statistics and information for teachers and students.

## Tech Stack

*   **Frontend:**
    *   React
    *   TypeScript
    *   Vite (Build Tool)
    *   Tailwind CSS (Styling)
    *   Wouter (Routing)
    *   React Query (Data Fetching and State Management)
    *   Shadcn/ui (UI Components)
*   **Backend:**
    *   Node.js
    *   Express.js
    *   TypeScript
*   **Database:**
    *   PostgreSQL (deployed via Neon serverless)
    *   Drizzle ORM (Database Interaction)
*   **Authentication:**
    *   Express Session (Session Management)
    *   Password-based local authentication (details not explicitly in Passport.js, but similar mechanism)

## Prerequisites

*   Node.js (v18.x or later recommended)
*   npm (v9.x or later, typically comes with Node.js) or yarn
*   Access to a PostgreSQL database (e.g., a local instance or a Neon serverless database).

## Getting Started/Setup Instructions

1.  **Clone the repository:**
    ```bash
    git clone <repository_url>
    cd <repository_directory>
    ```

2.  **Install dependencies:**
    Install dependencies for both the client and server.
    ```bash
    # From the root directory
    npm install
    cd client
    npm install
    cd ../server
    npm install
    cd .. 
    ```
    Alternatively, if there's a top-level `package.json` that handles both, adjust accordingly. (Assuming separate installs for now based on typical monorepo structure without root workspace management).
    *Correction based on project structure: Run `npm install` in the root, which should install for both client and server due to workspaces.*
    ```bash
    # From the root directory
    npm install 
    ```


3.  **Environment Variable Setup:**
    Create a `.env` file in the `server/` directory by copying the example file:
    ```bash
    cp server/.env.example server/.env
    ```
    Update the `server/.env` file with your specific configuration, primarily the `DATABASE_URL`:
    ```
    DATABASE_URL="postgresql://user:password@host:port/dbname?sslmode=require" 
    # Replace with your actual PostgreSQL connection string.
    # For Neon, get this from your Neon dashboard.
    
    SESSION_SECRET="your_strong_session_secret_here" 
    # Change this to a long, random string for security.
    ```

4.  **Database Migration:**
    Apply database schema changes using Drizzle ORM. Ensure your database server is running and accessible.
    ```bash
    # From the root directory
    npm run db:push
    ```

5.  **Run the Development Server:**
    This command will typically start both the backend server and the frontend Vite development server concurrently.
    ```bash
    # From the root directory
    npm run dev
    ```

6.  **Access the Application:**
    Once the development server is running, the application should be accessible at:
    [http://localhost:5000](http://localhost:5000) (or the port specified in your Vite/Express config if different).

## Available Scripts

In the root `package.json`:

*   `dev`: Starts both the backend and frontend development servers.
*   `build`: Builds the frontend and backend for production.
*   `start`: Starts the production server (after building).
*   `check`: Runs linters and type checking.
*   `db:generate`: Generates Drizzle ORM migration files based on schema changes.
*   `db:push`: Pushes schema changes to the database (for development).
*   `db:studio`: Opens Drizzle Studio to browse your database.

(Please verify these against the actual `package.json` scripts and update if necessary.)

## Project Structure

*   **`client/`**: Contains the frontend React application code (TypeScript, Vite, Tailwind CSS).
    *   `src/pages/`: Page components.
    *   `src/components/`: Reusable UI components.
    *   `src/hooks/`: Custom React hooks.
    *   `src/lib/`: Utility functions, API client.
*   **`server/`**: Contains the backend Express.js application code (TypeScript).
    *   `db/`: Drizzle ORM schema and migration files.
    *   `src/`: (If applicable, or routes/storage directly in `server/`) Backend source files.
    *   `routes.ts`: API route definitions.
    *   `storage.ts`: Database interaction logic.
*   **`shared/`**: Contains code shared between the client and server, such as TypeScript types and validation schemas (e.g., Zod schemas for Drizzle).

---

This README provides a good starting point for new developers and users of the EduFlow LMS project.
