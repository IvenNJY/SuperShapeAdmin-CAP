# FYP Admin

<!-- App Icon -->
<p align="center">
  <img src="https://raw.githubusercontent.com/IvenNJY/SuperShapeAdmin-CAP/refs/heads/main/public/logo.PNG" alt="App Icon" width="400" />
</p>

<!-- Tech Stack Badges -->
<p align="center">
  <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=white" alt="React" />
  <img src="https://img.shields.io/badge/TailwindCSS-38B2AC?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=white" alt="Firebase" />
</p>


## Live Demo

A live demo of the frontend is available here:

[Frontend Demo](https://sswadmin.netlify.app/)

**Demo Credentials:**
- Admin: `admin@gmail.com`
- Superadmin: `superadmin@gmail.com`

## Galary

Below is a preview of the live demo:

<p align="center">
  <img src="https://raw.githubusercontent.com/IvenNJY/SuperShapeAdmin-CAP/refs/heads/main/image%20samples/dashboard.png" alt="Demo Screenshot 1" width="250" />
  <img src="https://raw.githubusercontent.com/IvenNJY/SuperShapeAdmin-CAP/refs/heads/main/image%20samples/user-detail1.png" alt="Demo Screenshot 2" width="250" />
  <img src="https://raw.githubusercontent.com/IvenNJY/SuperShapeAdmin-CAP/refs/heads/main/image%20samples/user-detail2.png" alt="Demo Screenshot 3" width="250" />
</p>


## Prerequisites

- Node.js (v14 or later)
- npm

## Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd FYPadmin
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

## Environment Variables

This project uses environment variables for configuration, especially for Firebase.

1.  **Create a `.env` file in the root of the project.** You can do this by copying the sample file:
    ```bash
    copy .env.sample .env
    ```
2.  **Update the `.env` file with your Firebase project's configuration.** You can find these details in your Firebase project settings.

    ```
    VITE_API_KEY=your_api_key
    VITE_AUTH_DOMAIN=your_auth_domain
    VITE_PROJECT_ID=your_project_id
    VITE_STORAGE_BUCKET=your_storage_bucket
    VITE_MESSAGING_SENDER_ID=your_messaging_sender_id
    VITE_APP_ID=your_app_id
    VITE_MEASUREMENT_ID=your_measurement_id
    ```

## Running the Development Server

To run the application in development mode, use the following command:

```bash
npm run dev
```

This will start a development server, and you can view the application by navigating to the URL provided in your terminal (usually `http://localhost:5173`).

## Building for Production

To create a production build of the application, run:

```bash
npm run build
```

The production-ready files will be located in the `dist/` directory.

## Previewing the Production Build

To preview the production build locally, use the following command:

```bash
npm run preview
```

This will start a local server to serve the production files.

