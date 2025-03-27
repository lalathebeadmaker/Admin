# Admin Management App

A React-based admin management application for an e-commerce website, built with Vite, Firebase, and Tailwind CSS.

## Features

- Role-based authentication (Admin/User)
- Raw materials inventory management
- Product management
- Order management
- Shipping management
- Real-time data updates with Firebase

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
- Firebase account and project

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory with your Firebase configuration:
   ```
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

## Firebase Setup

1. Create a new Firebase project
2. Enable Authentication with Email/Password
3. Create a Firestore database
4. Set up security rules for Firestore
5. Create an admin user in the Authentication section
6. Add the user's role in Firestore under the `users` collection

## Project Structure

```
src/
  ├── components/
  │   ├── layout/
  │   ├── common/
  │   ├── forms/
  │   └── ui/
  ├── pages/
  │   ├── auth/
  │   ├── inventory/
  │   ├── products/
  │   ├── orders/
  │   └── shipping/
  ├── contexts/
  ├── services/
  ├── hooks/
  ├── types/
  └── utils/
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Styling System

### Theme Colors

This application uses a consistent color theme based around a sage green color (#6A7861). The theme is implemented using Tailwind CSS with custom color variables:

- **Primary Color**: Sage Green (#6A7861)
- **Shades**: Various shades of the primary color are available through Tailwind's color system
  - `primary-50` to `primary-900` for different shades

### Button System

The application implements a global button styling system for consistent UI:

#### Basic Usage

```jsx
// Standard button (sage green background with white text)
<button className="btn">Click Me</button>

// Secondary button (also sage green with white text)
<button className="btn-secondary">Click Me</button>
```

#### Button Variations

```jsx
// Large button
<button className="btn text-lg py-3">Large Button</button>

// Small button
<button className="btn text-xs py-1">Small Button</button>

// Disabled button
<button className="btn" disabled>Disabled Button</button>
```

For a complete reference of button styles and usage examples, visit the `/button-examples` route in the application.

## Responsive Design

The application features a fully responsive design with:

- Mobile-friendly layout
- Hamburger menu for small screens
- Adaptive content sizing
- Touch-friendly interface elements
