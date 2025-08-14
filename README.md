EcoHub is a web application built for businesses to manage their sustainability journey. It has four main features:

- Dashboard: A personalized overview of a business's sustainability score, recent activities, and AI-driven improvement suggestions.

- SustainaBOT: An AI-powered consultant that can generate tailored sustainability guidelines and even a formal business plan based on your company's practices.

- GreenMart: A marketplace for businesses to buy and sell recyclable materials and waste products, promoting a circular economy.
- Forum: A community space for businesses to discuss sustainability topics, share ideas, and learn from each other.

----------------------------------------------------------------------------

The app is built on a modern and robust tech stack:

- Frontend: Next.js with React and TypeScript. This provides a fast, server-rendered application that's great for performance and developer experience.

- Backend & Database: Firebase. We use Firestore for the database (storing user profiles, forum posts, marketplace products), Firebase Authentication for user sign-in, and Firebase Storage for file uploads (like profile pictures).

- AI Functionality: Genkit, Google's generative AI framework. This powers the SustainaBOT, enabling it to generate suggestions, business plans, and scores.

- UI & Styling: ShadCN UI and Tailwind CSS. This combination allows for building beautiful, accessible, and customizable components quickly.

----------------------------------------------------------------------------

The main logic resides in the src folder. This is the heart of your application, where every page and its corresponding URL is defined using the Next.js App Router.

layout.tsx & globals.css: The layout.tsx is the root template for your entire app. It sets up the HTML structure, theme provider, and toaster notifications. globals.css defines your app's core color palette and themes (light and dark).

----------------------------------------------------------------------------

(auth) Route Group: This folder contains all pages related to user authentication and onboarding, like /, /signin, /forgot-password, and /onboarding. The parentheses () mean this folder doesn't create a URL segment, so you go to /signin, not /auth/signin.

----------------------------------------------------------------------------

(app) Route Group: This contains all the pages a user sees after they have logged in.

- layout.tsx: This is a crucial file that defines the persistent user interface for the logged-in experience, including the main sidebar and the top header.

- dashboard/page.tsx: The main dashboard page. It fetches and displays the sustainability score, activities, and AI suggestions.

- sustainabot/page.tsx: The interface for interacting with the AI. It calls the Genkit flows to generate guidelines and business plans.

- greenmart/page.tsx: The marketplace page. It listens for real-time updates from Firestore to show product listings.

- forum/page.tsx: The community forum. It also uses real-time listeners to display and update posts and votes.

- settings/page.tsx: Where users can update their profile information, including their business name and profile picture.

----------------------------------------------------------------------------

This directory holds all the generative AI logic.

- genkit.ts: This file initializes Genkit and configures it to use Google's Gemini models.

- flows/...: Each file here defines a specific AI task, called a "Flow".

- generate-sustainability-suggestions.ts: Takes a business description and returns a list of actionable improvement tips.

- generate-business-plan.ts: Generates a full business plan with an executive summary, key initiatives, and financial projections.

- score-business.ts: Analyzes a business description and assigns it a sustainability score from 0-100.

- summarize-business-document.ts: Used during onboarding to read a PDF and create a concise summary of the business's practices.

----------------------------------------------------------------------------

This folder contains the logic for interacting with your Firebase database.

- firestore.ts: Defines the data structures (interfaces like Post, Product, UserProfile) and contains server-side functions to update and retrieve data, like updateUserProfile and getUserProfile.

- firestore-listeners.ts: Contains functions that set up real-time listeners. These are used on pages like the Forum and GreenMart to ensure that when data changes in the database, the user's screen updates automatically without needing a refresh.

----------------------------------------------------------------------------

These are custom React Hooks that encapsulate complex logic so it can be reused across different components.

- use-auth.tsx: This is one of the most important files in the app. It provides a global "context" that manages the current user's authentication status and profile data. Any component in the app can use this hook to know who is logged in and get their profile information. It also protects routes, redirecting unauthenticated users to the sign-in page.

- use-toast.ts: A custom hook for showing pop-up notifications (toasts) to the user.

----------------------------------------------------------------------------

This directory contains all the reusable UI components.

- ui/: This folder is filled with the base components from the ShadCN UI library (e.g., Button, Card, Input). These are the fundamental building blocks of your interface.

- image-uploader.tsx: A custom component built specifically for handling the profile picture upload logic, including compression and communication with Firebase Storage.

- sidebar-nav.tsx: Defines the navigation links that appear in the main sidebar.

This structure organizes the application logically, separating concerns like UI, state management, AI, and data services, making it scalable and easier to maintain.
