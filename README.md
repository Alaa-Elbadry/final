# Ahmed & Sherouk Wedding Invitation

A digital wedding invitation web application featuring a realistic interactive envelope, RSVP system, and public guest messages.

## Setup Instructions

1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```
4. Fill in the `.env` variables with your SMTP and Supabase details.

## Running Locally

Run the development server:
```bash
npm start
```
The website will be available at `http://localhost:3000`.

## Deployment

This project is structured for easy deployment to services like Render, Railway, or Vercel. 
- The Node.js backend serves both the API and the static frontend files.
- The hosting service should simply install dependencies with `npm install` and run the server with `npm start`.
- Make sure to set the environment variables in your hosting provider's dashboard.
