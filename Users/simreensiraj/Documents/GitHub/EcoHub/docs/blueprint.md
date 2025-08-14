# EcoHub: Your Partner in Sustainability

EcoHub is a comprehensive web application designed to empower businesses on their sustainability journey. It combines data-driven insights, AI-powered consultation, a circular economy marketplace, and a community forum into a single, intuitive platform.

## Table of Contents
1.  [Core Features](#core-features)
2.  [Technology Stack](#technology-stack)
3.  [Project Structure](#project-structure)
4.  [Key File Explanations](#key-file-explanations)
5.  [How to Run Locally](#how-to-run-locally)
6.  [Files to Ignore for Submission](#files-to-ignore-for-submission)
7.  [Style Guidelines](#style-guidelines)

---

## Core Features

*   **Dynamic Dashboard**: A personalized hub displaying a business's sustainability score, recent activities, actionable AI-driven improvement suggestions, and compliance with UN Sustainable Development Goals (SDGs).
*   **SustainaBOT**: An AI consultant that analyzes business practices to generate tailored sustainability guidelines and formal business plans.
*   **GreenMart**: A marketplace for businesses to buy and sell recyclable materials and byproducts, fostering a circular economy.
*   **Sustainability Forum**: A community-driven space for discussions, news, and knowledge-sharing on sustainability topics.
*   **Secure Onboarding & Profiles**: Secure user authentication with a comprehensive onboarding process to build a detailed business profile.

---

## Technology Stack

*   **Frontend**: [Next.js](https://nextjs.org/) with [React](https://react.dev/) and [TypeScript](https://www.typescriptlang.org/) using the App Router for a fast, server-first user experience.
*   **Backend & Database**: [Firebase](https://firebase.google.com/) for user authentication, a [Firestore](https://firebase.google.com/docs/firestore) NoSQL database, and [Cloud Storage](https://firebase.google.com/docs/storage) for file uploads.
*   **AI Functionality**: [Google's Genkit](https://firebase.google.com/docs/genkit) framework, powered by Gemini models, to drive all generative AI features.
*   **UI & Styling**: [ShadCN UI](https://ui.shadcn.com/) for accessible, pre-built components, styled with [Tailwind CSS](https://tailwindcss.com/) for a modern, responsive design.
*   **Data Visualization**: [Recharts](https://recharts.org/) for displaying charts and graphs on the dashboard.

---

## Project Structure

The project follows a standard Next.js App Router structure. The `src` directory contains all the core application code.

```
/
├── public/                # Static assets (images, manifest.json)
├── src/
│   ├── app/               # Main application routes
│   │   ├── (app)/         # Logged-in user routes (dashboard, forum, etc.)
│   │   │   ├── dashboard/
│   │   │   ├── sustainabot/
│   │   │   └── layout.tsx   # Persistent layout for logged-in users (sidebar, header)
│   │   ├── (auth)/        # Authentication routes (sign-in, sign-up, onboarding)
│   │   │   └── page.tsx     # Sign-up page is the root
│   │   ├── globals.css    # Global styles and ShadCN theme variables
│   │   └── layout.tsx     # Root layout for the entire app
│   ├── ai/                # All Genkit AI logic
│   │   ├── flows/         # Individual AI tasks (e.g., scoring, generating plans)
│   │   └── genkit.ts      # Genkit initialization and configuration
│   ├── components/        # Reusable React components
│   │   └── ui/            # Base ShadCN UI components
│   ├── hooks/             # Custom React hooks (e.g., use-auth.tsx)
│   ├── lib/               # Utility functions and Firebase configuration
│   └── services/          # Firestore data models and database interaction functions
├── .env                   # Environment variables (API keys)
├── .gitignore             # Files and folders to ignore for version control
├── next.config.ts         # Next.js configuration
└── package.json           # Project dependencies and scripts
```

---

## Key File Explanations

Here is a breakdown of the most important files and what they do.

### `src/hooks/use-auth.tsx`

This is the heart of the application's session management. It's a custom React Hook that provides authentication status and user profile data to any component that needs it.

*   **`AuthContext`**: A React Context that holds the user's state (`user`, `profile`, `loading`).
*   **`AuthProvider`**: A wrapper component that subscribes to Firebase Authentication's `onAuthStateChanged` listener.
*   **`onAuthStateChanged`**: When a user signs in or out, this listener fires. It fetches the corresponding user profile from Firestore using `getUserProfile` and updates the global state.
*   **Protected Routes**: It handles routing logic. If a user is not logged in, it redirects them to the sign-up page (`/`) to protect the main app routes.
*   **`forceProfileRefresh`**: A function to manually re-fetch user data, used after a profile update.

### `src/app/(app)/dashboard/page.tsx`

This file represents the main dashboard a user sees after logging in. It's a great example of how frontend components, AI, and database services work together.

*   **State Management**: Uses `useState` and `useEffect` to manage local component state like the sustainability score, activities, and AI-generated suggestions.
*   **Data Fetching**: The `fetchDashboardData` function is the primary data loader. It runs when the component mounts and makes parallel calls to multiple AI flows:
    *   `scoreBusiness`: Gets the main score.
    *   `generateSustainabilitySuggestions`: Gets the "Ways to Improve" list.
    *   `generateSdgCompliance`: Gets data for the SDG chart.
*   **User Interaction**: Contains functions like `handleAddActivity` and `handleUpdateDescription`. These functions first call a server-side `updateUserProfile` function to save data to Firestore, then call the appropriate AI flows to get an updated score or new suggestions.
*   **Dynamic UI**: The UI conditionally renders loading skeletons while data is being fetched and then displays the data using components like `<Progress>`, `<BarChart>`, and `<Card>`.

### `src/ai/flows/score-business.ts`

This is a perfect example of a self-contained Genkit AI flow. It has one job: analyze a business description and return a score.

*   **`'use server';`**: A Next.js directive indicating this code only runs on the server, which is secure and efficient.
*   **Schema Definitions (Zod)**: It uses the `zod` library to define strict schemas for its input (`ScoreBusinessInputSchema`) and output (`ScoreBusinessOutputSchema`). This ensures that the AI receives and returns data in a predictable, structured format.
*   **Prompt Template**: The `ai.definePrompt` function contains the core instructions for the AI. It uses Handlebars syntax (`{{businessPractices}}`) to inject the user's business data into the prompt. The prompt clearly tells the AI its role ("sustainability scoring expert") and the exact format for the output.
*   **Flow Definition**: `ai.defineFlow` wraps the prompt, creating an executable function. This flow takes the validated input, calls the AI with the prompt, and returns the validated output.

### `src/services/firestore.ts`

This file defines the data structures and provides server-side functions for interacting with the Firestore database.

*   **Interfaces**: Defines TypeScript interfaces (`UserProfile`, `Post`, `Product`) that act as a contract for the shape of data stored in Firestore collections. This improves code quality and prevents data-related bugs.
*   **`updateUserProfile`**: An async function that takes a user's email and new data. It uses `setDoc` with `{ merge: true }` to either create a new user profile document or update an existing one without overwriting the entire document. This is the primary function for saving user data.
*   **`getUserProfile`**: Fetches a single user profile document from Firestore. This is used by the `use-auth` hook during login to retrieve the user's data.

---

## How to Run Locally

1.  **Clone the Repository**:
    ```bash
    git clone https://github.com/simreensiraj/EcoHub.git
    cd EcoHub
    ```

2.  **Install Dependencies**:
    Requires [Node.js](https://nodejs.org/).
    ```bash
    npm install
    ```

3.  **Set Up Environment Variables**:
    Create a file named `.env` in the root of the project and add your Firebase Project ID. This is required for Genkit to connect to the right project.
    ```
    GCLOUD_PROJECT=ecohub-2tdq2
    ```

4.  **Run the Development Server**:
    ```bash
    npm run dev
    ```

5.  **Open the App**:
    Navigate to [http://localhost:9002](http://localhost:9002) in your browser.

---

## Files to Ignore for Submission

When you submit your project, you should not include files that contain local configuration, large dependencies, or build artifacts. The `.gitignore` file in this repository is already configured to handle this. Key folders and files to exclude are:

*   **/node_modules/**: This directory contains all the downloaded dependencies, can be very large, and should always be re-installed from `package.json` by running `npm install`.
*   **/.next/**: This is the build output directory created by Next.js when you run the app. It's generated automatically.
*   **/.env***: These files contain environment variables and secrets (like API keys). They should never be committed to version control for security reasons. Your competition judges will need instructions on how to create their own `.env` file.
*   **Misc files**: `.DS_Store` (macOS), IDE configuration folders like `.vscode/`.

By using the provided `.gitignore` file, you ensure a clean, secure, and professional submission.

---

## Style Guidelines

*   **Primary color**: Deep forest green (#228B22) to represent nature and sustainability.
*   **Background color**: Earthy beige (#F5F5DC) to provide a calm, neutral backdrop.
*   **Accent color**: Earthy brown (#D4AF37) to highlight key interactive elements.
*   **Body text**: 'PT Sans', a humanist sans-serif.
*   **Header font**: 'Playfair', a modern sans-serif. When paired with PT Sans, it adds an elegant feel.
*   **Icons**: Clean, minimalist icons with rounded edges to convey modernity and friendliness.
*   **Layout**: A modern and clean layout with ample white space to prevent clutter.