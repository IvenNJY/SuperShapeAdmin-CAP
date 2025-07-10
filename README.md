# FYP Admin

This project is a frontend application built with Vite, React, and Tailwind CSS. It uses Firebase for backend services.

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

