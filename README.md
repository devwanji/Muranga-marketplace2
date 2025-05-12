# Murang'a Marketplace

A full-stack web application connecting local businesses in Murang'a County, Kenya with potential customers through an intuitive digital marketplace.

## Features

- **Business Directory**: Browse businesses by category and location
- **Advanced Search**: Find businesses by name, category, or keywords
- **User Authentication**: Secure login with email/password and Google account options
- **Business Registration**: Simple process for business owners to list their services
- **Subscription Plans**: Monthly and annual subscription options
- **M-Pesa Integration**: Secure payments through Kenya's popular mobile money system
- **Responsive Design**: Optimized for mobile, tablet, and desktop devices

## Tech Stack

### Frontend
- React with TypeScript
- TailwindCSS for styling
- ShadCN UI component library
- React Query for data fetching
- React Hook Form for form management
- Firebase Authentication
- Wouter for routing

### Backend
- Express.js/Node.js
- PostgreSQL database
- Drizzle ORM for database interactions
- M-Pesa Daraja API integration

## Setup Instructions

### Prerequisites
- Node.js v16+ and npm
- PostgreSQL database
- Firebase project
- M-Pesa Daraja API account

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```
# Database
DATABASE_URL=postgresql://username:password@host:port/database

# Firebase
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_APP_ID=your_firebase_app_id

# M-Pesa
MPESA_CONSUMER_KEY=your_mpesa_consumer_key
MPESA_CONSUMER_SECRET=your_mpesa_consumer_secret
MPESA_SHORTCODE=your_mpesa_shortcode
MPESA_PASSKEY=your_mpesa_passkey
```

### Installation Steps

1. Clone the repository:
   ```
   git clone https://github.com/YOUR-USERNAME/muranga-marketplace.git
   cd muranga-marketplace
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set up the database:
   ```
   npm run db:push
   ```

4. Start the development server:
   ```
   npm run dev
   ```

5. Access the application at `http://localhost:5000`

### Firebase Configuration

1. Create a project in the [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication service
3. Add Email/Password and Google as sign-in methods
4. Add your domain to the authorized domains list in Authentication settings
5. Copy the Firebase config values to your environment variables

### M-Pesa Integration

1. Register for a [Safaricom Developer](https://developer.safaricom.co.ke/) account
2. Create a Daraja API app and get your credentials
3. Set up the callback URL to `https://your-domain.com/api/payment/callback`
4. Add your credentials to the environment variables

## Project Structure

- `/client` - Frontend React application
- `/server` - Backend Express application
- `/shared` - Shared TypeScript types and schemas
- `/migrations` - Database migration files

## Database Schema

The application uses the following main tables:
- `users` - User accounts
- `businesses` - Business listings
- `categories` - Business categories
- `locations` - Geographic locations in Murang'a County
- `reviews` - Customer reviews
- `testimonials` - Featured testimonials
- `subscription_plans` - Available subscription options
- `business_subscriptions` - Active business subscriptions
- `mpesa_payments` - Payment transaction records

## Deployment

This project can be deployed to any Node.js hosting platform:

1. Build the frontend:
   ```
   npm run build
   ```

2. Deploy to your preferred hosting provider, ensuring environment variables are set

## License

[MIT License](LICENSE)