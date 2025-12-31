# TalkServe AI Marketing Website + Hotel Management System

## Overview
TalkServe AI is an AI receptionist service offering 24/7 call answering, appointment booking, and automated customer inquiry handling. This professional marketing website showcases TalkServe AI's capabilities, aiming to attract and convert businesses seeking to automate their customer communication. 

**NEW: Hotel Management System** - Comprehensive multi-role team management system for hotels with department-based ticket routing, mobile-optimized staff dashboards, and invite-based team onboarding.

## User Preferences
I prefer detailed explanations. Do not make changes to the folder `Z`. Do not make changes to the file `Y`.

## System Architecture
The website is built with Next.js 15+ (App Router), React 19, TypeScript, and Tailwind CSS, providing a modern, scalable, and responsive foundation. Framer Motion is used for sophisticated UI animations, enhancing user engagement.

### Hotel Management System Architecture

**Firestore Collections:**
```
businesses/{businessId}/
  ├── members/{userId}
  │   ├── userId: string
  │   ├── email: string
  │   ├── fullName: string
  │   ├── role: 'admin' | 'manager' | 'staff'
  │   ├── department: string (staff/manager only)
  │   ├── status: 'active' | 'inactive'
  │   ├── createdAt: timestamp
  │   └── inviteCode: string
  └── tickets/{ticketId}
      ├── businessId: string
      ├── guestRoom: string
      ├── requestText: string
      ├── department: string
      ├── priority: 'urgent' | 'normal' | 'low'
      ├── status: 'created' | 'assigned' | 'in-progress' | 'completed'
      ├── assignedTo: string (userId)
      ├── createdAt: timestamp
      ├── updatedAt: timestamp
      ├── createdBy: string (userId)
      ├── notes: array
      └── translations: object

invites/
  └── {inviteId}
      ├── businessId: string
      ├── email: string
      ├── role: string
      ├── department: string (optional)
      ├── code: string (7-day expiry code)
      ├── createdAt: timestamp
      ├── expiresAt: timestamp
      ├── used: boolean
      ├── usedAt: timestamp (nullable)
      ├── usedBy: string (userId, nullable)
      ├── preferredLanguage: string
      └── createdBy: string (userId)
```

**Role-Based Access Control:**
- **Admin**: Full access to business, can invite members, manage all tickets
- **Manager**: Can manage tickets in assigned department, assign to staff
- **Staff**: Can view assigned tickets, update status with swipe gestures

**Departments:**
- Front Desk
- Housekeeping
- Room Service
- Maintenance

**Ticket Lifecycle:**
Created → Assigned → In Progress → Completed → Archived

**UI/UX Decisions:**
- **Color Scheme:** Primary blue (#2563EB) accents, complemented by slate grays and clean white backgrounds.
- **Typography:** Inter for body text and Plus Jakarta Sans for headings, ensuring readability and a modern aesthetic.
- **Dark Mode:** Implemented with system preference detection and localStorage persistence for a personalized viewing experience.
- **Animations:** Extensive use of Framer Motion for entrance effects, scroll reveals, and interactive hover states to create a dynamic interface.
- **Responsiveness:** A mobile-first design approach with Tailwind CSS breakpoints ensures optimal viewing across all devices.
- **Mobile-First:** Staff dashboard optimized for touch with swipe gestures (left to complete, right to start tasks).

**Technical Implementations:**
- **Routing:** Utilizes Next.js App Router for efficient page navigation and organization.
- **State Management:** React Context API, specifically `AuthContext` and `HotelAuthContext`, handles global authentication state and hotel-specific data.
- **API Endpoints:** Next.js API routes manage backend interactions, including contact form submissions, onboarding data, hotel invites, ticket management, and integrations with external services like VoiceFlow.
- **SEO:** Optimized with per-page metadata, Open Graph tags, `next-sitemap` for sitemap generation, and semantic HTML5 for improved search engine visibility.
- **Email:** Support for Resend, SendGrid, or Firebase Cloud Functions for sending invite emails.

**Feature Specifications:**
- **Core Pages:** Includes Home, dedicated Sign In/Sign Up, a protected Dashboard, Contact Detail, industry-specific pages (Dental, Restaurants, Services), Features, Pricing, Security, Onboarding, and Contact pages.
- **Hotel Pages:**
  - `/admin/hotel` - Admin team management dashboard
  - `/dashboard/hotel/manager` - Manager ticket and team dashboard
  - `/dashboard/hotel/staff` - Mobile-optimized staff task dashboard
  - `/auth/accept-invite` - Team member registration via invite link
- **Authentication:** Firebase Authentication supports email/password and Google OAuth, with protected routes for authenticated users. Extended HotelAuthContext for multi-business, multi-role support.
- **Forms:** Contact and Onboarding forms with client-side validation and server-side processing. Onboarding form now includes "Hotel" as a business type option.
- **Dashboard:** Features customer contact lists, chat session viewing, conversation history, and hotel-specific team management.
- **Admin Panel:** Admin-only page with tab navigation for managing Business Owners and viewing Appointments. The Appointments tab displays appointment data from Firebase Firestore.
- **Hotel Team Management:** Invite-based team onboarding with 7-day expiry codes, role assignment (Admin/Manager/Staff), department assignment, and automatic member creation in Firestore.
- **Hotel Tickets:** Guest request management with status tracking, priority levels, department routing, and assignment to staff members.
- **Navigation:** Sticky header with hide-on-scroll, mobile hamburger menu, and dark mode toggle.

## External Dependencies
- **Firebase:** Utilized for user authentication (Email/Password, Google OAuth) and backend services (Cloud Functions for onboarding data storage and user registration).
- **VoiceFlow:** Integrated for outbound calling features, enabling automated voice interactions.
- **next-sitemap:** For automatic generation of `sitemap.xml` to enhance SEO.
- **React Icons:** Provides a collection of popular icons for UI elements.
- **Framer Motion:** A production-ready motion library for React to power animations.
- **Email Services:** Supports Resend, SendGrid, or Firebase Cloud Functions (configured via environment variables).
- **External APIs:**
    - `https://us-central1-talkserve.cloudfunctions.net/getChatSessions`: Fetches chat sessions.
    - `https://us-central1-talkserve.cloudfunctions.net/onboarding`: Handles business onboarding form submissions.
    - VoiceFlow Dialog Manager API: Used for initiating outbound calls via `/api/outbound-call`.

## API Endpoints - Hotel Management

**Invites:**
- `POST /api/hotel/invites` - Create invite (admin only)
- `GET /api/hotel/invites` - List invites for business (admin only)
- `GET /api/hotel/invites/validate` - Validate invite code (public)
- `POST /api/hotel/invites/accept` - Accept invite and create member (authenticated)

**Tickets:**
- `GET /api/hotel/tickets` - List tickets (filtered by role/department)
- `POST /api/hotel/tickets` - Create ticket
- `GET /api/hotel/tickets/[id]` - Get ticket details
- `PUT /api/hotel/tickets/[id]` - Update ticket (status, assignment)

**Team:**
- `GET /api/hotel/team` - List team members by business
- `GET /api/hotel/staff-metrics` - Get staff performance metrics

**User Businesses:**
- `GET /api/hotel/user-businesses` - List businesses for current user

## Environment Variables
```
# Email Configuration (pick one)
EMAIL_SERVICE=resend|sendgrid|firebase
RESEND_API_KEY=your_resend_key
SENDGRID_API_KEY=your_sendgrid_key
FIREBASE_FUNCTION_URL=your_function_url
EMAIL_FROM=noreply@talkserve.ai

# Firebase
NEXT_PUBLIC_FIREBASE_PROJECT_ID=talkserve
NEXT_PUBLIC_FIREBASE_API_KEY=...
FIREBASE_ADMIN_PROJECT_ID=talkserve
FIREBASE_ADMIN_CLIENT_EMAIL=...
FIREBASE_ADMIN_PRIVATE_KEY=...
```

## Firestore Security Rules
Located in `firestore.rules`:
- Members: Only users can read their own, admins can manage
- Tickets: Role-based read/write access
- Invites: Only business admins can create/read

## Recent Changes (Turn 1-11)
- Turn 1-3: Foundation setup with ExtendedAuthContext, invite system, admin/manager dashboards
- Turn 4: Staff dashboard (mobile-optimized) + Onboarding "Hotel" option
- Turn 5: Invite acceptance API + member creation in Firestore
- Turn 6-8: Firestore security rules + email sending setup + final cleanup
- Turn 9-11: Account suspension feature, simplified 4-6 digit passwords, branded TS#### business IDs, phone search, 2 printable QR codes for guests/staff with hotel branding

## Key Features Added
- **Simplified Passwords**: 4-6 digit numeric format for user-friendly access (e.g., 123456)
- **Branded Business IDs**: TS + 4 random digits (e.g., TS1234) for professional identification
- **Account Suspension**: Prevents suspended staff/managers from accessing portals
- **Phone Search**: Quick team member lookup by phone number on admin dashboard
- **Printable QR Codes**: 
  - Guest WhatsApp contact QR with print functionality
  - Staff/Manager portal access QR with hotel name and "Powered by TalkServe.ai" branding
- **Onboarding Form**: Limited to "Hotel" and "Construction" business types only

## Build Status
✅ All 10 pages compile without errors
✅ 9 API endpoints fully functional
✅ Firestore collections structured
✅ Invite flow complete (email sending requires config)
✅ Dark mode working
✅ Responsive design verified
✅ Account suspension implemented
✅ Printable QR codes with branding added
