# EduFlow LMS - Deployment Plan

## 1. Introduction

This document outlines the deployment plan for the EduFlow Learning Management System (LMS). Its purpose is to guide the process of deploying the application to a production environment.

The application's tech stack consists of:
*   **Backend:** Node.js with Express.js (TypeScript)
*   **Frontend:** React (TypeScript) with Vite
*   **Database:** PostgreSQL (currently using Neon for development)

These choices influence the suitable deployment strategies and platforms.

## 2. Deployment Choices & Considerations

Several approaches can be taken to deploy the EduFlow application. The best choice depends on factors like budget, team expertise, scalability needs, and desired level of control.

### Platform as a Service (PaaS)

*   **Examples:**
    *   **Backend:** Heroku (Node.js buildpack), Render (Node.js service), Fly.io.
    *   **Frontend:** Vercel, Netlify, Render (Static Site).
*   **Pros:**
    *   **Simplicity:** PaaS providers handle much of the infrastructure management (servers, patching, scaling basics).
    *   **Developer Experience:** Often offer streamlined Git-based deployments and CI/CD integration.
    *   **Managed Services:** Easy integration with managed databases, logging, etc.
*   **Cons:**
    *   **Less Flexibility:** More opinionated environments can limit configuration options.
    *   **Cost:** Can become expensive as the application scales or requires more resources.
    *   **Vendor Lock-in:** Migrating away from a PaaS can sometimes be challenging.

### Containers (Docker)

*   **Explanation:** The frontend and backend applications can be packaged into separate Docker containers. This ensures consistency between development, testing, and production environments.
    *   **Backend Container:** Would contain the Node.js runtime, built server code, and dependencies.
    *   **Frontend Container:** Could serve the static built assets using a lightweight web server like Nginx.
*   **Deployment Platforms:**
    *   Docker Hub (for storing images).
    *   AWS Elastic Container Service (ECS).
    *   Google Cloud Run.
    *   Kubernetes (e.g., AWS EKS, Google GKE, DigitalOcean Kubernetes).
    *   Render (supports deploying Docker containers).
*   **Pros:**
    *   **Consistency:** "Works on my machine" problems are greatly reduced.
    *   **Scalability:** Container orchestration platforms provide robust scaling capabilities.
    *   **Portability:** Containers can run on any platform that supports Docker.
*   **Cons:**
    *   **Learning Curve:** Requires familiarity with Docker, and potentially Kubernetes if used.
    *   **Complexity:** Managing container orchestration can be complex for smaller teams or projects.

### Virtual Private Server (VPS)

*   **Examples:** DigitalOcean Droplets, Linode, AWS EC2, Vultr.
*   **Pros:**
    *   **Full Control:** Complete control over the server environment, software installation, and configuration.
    *   **Cost-Effective (Potentially):** Can be cheaper for certain workloads if managed efficiently.
*   **Cons:**
    *   **Manual Setup & Maintenance:** Requires manual setup of the operating system, web server (e.g., Nginx as a reverse proxy), Node.js runtime, database (if self-hosted), process manager (e.g., PM2), SSL certificates, firewalls, and ongoing security patching and updates.
    *   **Scalability:** Manual scaling process unless custom automation is implemented.
    *   **Higher Operational Overhead:** Significant time investment for infrastructure management.

**Recommendation:** For initial deployment and teams prioritizing ease of use, a **PaaS** (like Render or Heroku for backend, Vercel/Netlify/Render for frontend) is often a good starting point. As the application grows or if more control is needed, **Containers** offer a more robust and scalable solution.

## 3. Database Deployment

The application uses PostgreSQL.

*   **Managed Database Services:**
    *   **Examples:** AWS RDS for PostgreSQL, Google Cloud SQL for PostgreSQL, Heroku Postgres, Render PostgreSQL, **Neon**.
    *   **Recommendation:** **Strongly recommended.** Managed services handle backups, replication, scaling, security updates, and maintenance, significantly reducing operational burden and improving reliability. Since Neon is already used for development and is designed for serverless/production workloads, it's an excellent candidate for production.
*   **Self-hosting on a VPS:**
    *   Possible, but involves installing, configuring, securing, backing up, and maintaining the PostgreSQL server manually. This adds significant operational overhead and risk if not managed by experienced personnel.

**Choice:** Continue using **Neon** for production, or select another reputable managed PostgreSQL provider.

## 4. Frontend Deployment Strategy

The frontend is a React application built with Vite.

*   **Static Hosting:**
    *   **Process:** The `npm run build` command (likely within the `client` directory, e.g., `cd client && npm run build`) compiles the React application into static HTML, CSS, and JavaScript assets.
    *   **Platforms:** Vercel, Netlify, Render (Static Sites), AWS S3 + CloudFront, GitHub Pages (for simpler projects).
    *   **Benefits:** These platforms are optimized for serving static files, offering excellent performance, global distribution (CDNs), and often free or low-cost tiers.
*   **Configuration:**
    *   An environment variable, typically `VITE_API_BASE_URL` (or similar, check `client/.env.example` or code), must be configured during the build process or at runtime to point to the deployed backend API's URL.

**Recommendation:** Use **Vercel** or **Netlify** for the frontend due to their excellent developer experience, CI/CD integration, and performance for React applications. Render Static Sites is also a good option if keeping services on one platform is preferred.

## 5. Backend Deployment Strategy

The backend is a Node.js/Express.js application written in TypeScript.

*   **Node.js Hosting Platforms:**
    *   **PaaS:** Heroku (Node.js buildpack), Render (Node.js service).
    *   **Containers:** Deploying a Docker container running the Node.js application on platforms like AWS ECS, Google Cloud Run, or Render.
    *   **VPS:** Manually setting up Node.js, a process manager (like PM2), and a reverse proxy (like Nginx).
*   **Build Process:**
    *   The TypeScript code needs to be transpiled to JavaScript. The `npm run build` script in the `server` directory (or a root build script) should handle this, typically outputting to a `dist` folder within `server`.
*   **Configuration (Environment Variables):**
    *   `DATABASE_URL`: The connection string for the production PostgreSQL database.
    *   `SESSION_SECRET`: A long, random, and strong secret for session management.
    *   `NODE_ENV`: Set to `production`. This optimizes Express and other libraries.
    *   `PORT`: The port the application should listen on (often provided by the PaaS, e.g., `process.env.PORT || 3001`).
    *   Any other API keys or service credentials.
*   **Start Command:**
    *   The `package.json` in the `server` directory (or root) should have a `start` script that runs the built JavaScript application (e.g., `node dist/server.js`).

**Recommendation:** Use **Render** (Node.js service) or **Heroku** for ease of deployment. If containerization is chosen, Render also supports Docker.

## 6. General Deployment Steps (Example using Render)

This example assumes deploying the backend as a Render Web Service and the frontend as a Render Static Site.

### Prepare the Application:

1.  **Verify Build Scripts:**
    *   Root `package.json`: Ensure `npm run build` correctly builds both client and server.
        *   Client build output: `client/dist`
        *   Server build output: `server/dist` (or similar)
2.  **Verify Start Script:**
    *   Root `package.json`: Ensure `npm start` correctly starts the production server (e.g., `node server/dist/server.js`).
3.  **Environment Variables:**
    *   Document all required environment variables for both frontend and backend (check `.env.example` files).
4.  **Git Repository:** Ensure all code is committed and pushed to a Git provider (GitHub, GitLab, Bitbucket).

### Database Setup:

1.  **Create Production Database:**
    *   If using Neon, ensure you have a production-ready branch/project.
    *   Alternatively, create a new PostgreSQL instance on Render or another managed provider.
2.  **Obtain Connection String:** Securely note the `DATABASE_URL`.

### Backend Deployment (Render Web Service):

1.  **Create New Web Service:** In Render dashboard, select "New Web Service".
2.  **Connect Repository:** Connect the Git repository hosting the EduFlow project.
3.  **Settings:**
    *   **Name:** e.g., `eduflow-backend`
    *   **Region:** Choose a region close to your users.
    *   **Branch:** `main` or your production branch.
    *   **Root Directory:** Leave blank if `package.json` is in root, or specify `server/` if backend has its own `package.json` and build is run from there. (For this project, it's likely the root due to workspaces).
    *   **Runtime:** `Node` (Render usually auto-detects).
    *   **Build Command:** `npm install && npm run build` (This should trigger the build for both server and client if using workspaces and scripts are set up correctly in root `package.json`).
    *   **Start Command:** `npm start` (This should run the server from its built location, e.g., `node server/dist/index.js`).
    *   **Instance Type:** Choose an appropriate plan.
4.  **Environment Variables:**
    *   Click "Add Environment Variable".
    *   `DATABASE_URL`: (Paste your production database connection string).
    *   `SESSION_SECRET`: (Generate a strong, unique secret).
    *   `NODE_ENV`: `production`.
    *   Any other required backend secrets.
5.  **Deploy:** Click "Create Web Service". Render will build and deploy the application.

### Frontend Deployment (Render Static Site):

1.  **Create New Static Site:** In Render dashboard, select "New Static Site".
2.  **Connect Repository:** Connect the same Git repository.
3.  **Settings:**
    *   **Name:** e.g., `eduflow-frontend`
    *   **Branch:** `main` or your production branch.
    *   **Build Command:** `npm install && npm run build` (Render might need context if the build command for the client specifically is different or needs a path prefix, e.g., `cd client && npm install && npm run build` or ensure root `build` script handles `client/dist` correctly). *Verify this based on `package.json` scripts. Often, for monorepos, you specify the client's build command and publish directory.*
        *   It's common to set the **Root Directory** to `client` for a client-only static site build if the root build doesn't place client assets in a top-level `dist`. *Correction*: For this project, the root `build` script likely handles building the client into `client/dist`. So, the build command might remain `npm install && npm run build` (from root) and publish directory would be `client/dist`.
    *   **Publish Directory:** `client/dist` (or the actual output directory of the client build).
4.  **Environment Variables (Build Time):**
    *   Click "Add Environment Variable".
    *   `VITE_API_BASE_URL`: (The URL of your deployed `eduflow-backend`, e.g., `https://eduflow-backend.onrender.com`).
5.  **Deploy:** Click "Create Static Site".

### Domain Configuration:

*   Once services are deployed, navigate to their settings in Render.
*   Add custom domains (e.g., `app.eduflow.com` for frontend, `api.eduflow.com` for backend) and follow DNS configuration instructions.

### SSL/TLS:

*   Render (and most PaaS providers like Vercel, Netlify) automatically provisions and renews SSL certificates for custom domains.

## 7. Post-Deployment Checklist

*   **Thorough Testing:**
    *   Test user registration and login for both students and teachers.
    *   Verify profile updates.
    *   Test course creation (teacher) and enrollment (student).
    *   Verify course content viewing.
    *   Test assignment creation (teacher - if UI exists), submission (student), and viewing.
    *   Check all navigation and UI interactions.
*   **Logging & Monitoring:**
    *   Integrate or enable logging services (Render provides logs, or use a third-party like Sentry, Logtail, Datadog).
    *   Set up basic uptime monitoring (e.g., UptimeRobot, Better Uptime).
*   **Backups:**
    *   Confirm that your managed database service (e.g., Neon) has automated backups configured and understand the retention policy. If self-hosting, implement a robust backup strategy.
*   **Security:**
    *   Review security headers (e.g., using Helmet middleware in Express if not already).
    *   Ensure sensitive environment variables are not exposed on the client-side.
*   **CI/CD (Continuous Integration/Continuous Deployment):**
    *   Consider setting up CI/CD pipelines (e.g., using GitHub Actions, GitLab CI, or Render's auto-deploy on push feature) to automate testing and deployment for future updates.
*   **Environment Variable Review:** Double-check all environment variables are correctly set for the production environment.
*   **Performance Check:** Basic performance and load testing, if feasible.

This deployment plan provides a comprehensive guide. Specific details may vary based on the chosen hosting platforms and tools. Always refer to the official documentation of the selected services for the most accurate and up-to-date instructions.
