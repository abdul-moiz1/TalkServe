# TalkServe AI Marketing Website

## Overview
TalkServe AI is an AI receptionist service offering 24/7 call answering, appointment booking, and automated customer inquiry handling. This professional marketing website showcases TalkServe AI's capabilities, aiming to attract and convert businesses seeking to automate their customer communication. The project emphasizes a robust, modern web presence with a focus on user experience, performance, and clear communication of the service's value.

## User Preferences
I prefer detailed explanations. Do not make changes to the folder `Z`. Do not make changes to the file `Y`.

## System Architecture
The website is built with Next.js 15+ (App Router), React 19, TypeScript, and Tailwind CSS, providing a modern, scalable, and responsive foundation. Framer Motion is used for sophisticated UI animations, enhancing user engagement.

**UI/UX Decisions:**
- **Color Scheme:** Primary blue (#2563EB) accents, complemented by slate grays and clean white backgrounds.
- **Typography:** Inter for body text and Plus Jakarta Sans for headings, ensuring readability and a modern aesthetic.
- **Dark Mode:** Implemented with system preference detection and localStorage persistence for a personalized viewing experience.
- **Animations:** Extensive use of Framer Motion for entrance effects, scroll reveals, and interactive hover states to create a dynamic interface.
- **Responsiveness:** A mobile-first design approach with Tailwind CSS breakpoints ensures optimal viewing across all devices.

**Technical Implementations:**
- **Routing:** Utilizes Next.js App Router for efficient page navigation and organization.
- **State Management:** React Context API, specifically `AuthContext`, handles global authentication state.
- **API Endpoints:** Next.js API routes manage backend interactions, including contact form submissions, onboarding data, and integrations with external services like VoiceFlow.
- **SEO:** Optimized with per-page metadata, Open Graph tags, `next-sitemap` for sitemap generation, and semantic HTML5 for improved search engine visibility.

**Feature Specifications:**
- **Core Pages:** Includes Home, dedicated Sign In/Sign Up, a protected Dashboard, Contact Detail, industry-specific pages (Dental, Restaurants, Services), Features, Pricing, Security, Onboarding, and Contact pages.
- **Authentication:** Firebase Authentication supports email/password and Google OAuth, with protected routes for authenticated users.
- **Forms:** Contact and Onboarding forms with client-side validation and server-side processing. The Onboarding form supports file uploads and integrates with Firebase Cloud Functions.
- **Dashboard:** Features customer contact lists, chat session viewing, and conversation history.
- **Navigation:** Sticky header with hide-on-scroll, mobile hamburger menu, and dark mode toggle.

## External Dependencies
- **Firebase:** Utilized for user authentication (Email/Password, Google OAuth) and backend services (Cloud Functions for onboarding data storage and user registration).
- **VoiceFlow:** Integrated for outbound calling features, enabling automated voice interactions.
- **next-sitemap:** For automatic generation of `sitemap.xml` to enhance SEO.
- **React Icons:** Provides a collection of popular icons for UI elements.
- **Framer Motion:** A production-ready motion library for React to power animations.
- **External APIs:**
    - `https://us-central1-talkserve.cloudfunctions.net/getChatSessions`: Fetches chat sessions.
    - `https://us-central1-talkserve.cloudfunctions.net/onboarding`: Handles business onboarding form submissions.
    - VoiceFlow Dialog Manager API: Used for initiating outbound calls via `/api/outbound-call`.