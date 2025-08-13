# Deployment Configuration

## Environment Variables for Production

When deploying to Vercel or other production environments, make sure to set the following environment variable:

### Required Environment Variables

- `NEXT_PUBLIC_SITE_URL` - The full URL of your deployed application (e.g., `https://your-app.vercel.app`)

### Vercel Deployment

1. In your Vercel dashboard, go to your project settings
2. Navigate to "Environment Variables"
3. Add `NEXT_PUBLIC_SITE_URL` with your Vercel app URL as the value
4. Redeploy your application

### Why This Is Important

The `NEXT_PUBLIC_SITE_URL` environment variable ensures that:
- Signup confirmation emails redirect to the correct production URL
- Users don't get redirected to localhost:3000 after email confirmation
- The authentication flow works seamlessly in production

### Development vs Production

- **Development**: Falls back to `window.location.origin` (localhost:3000)
- **Production**: Uses `NEXT_PUBLIC_SITE_URL` when set, ensuring proper redirects

## Testing the Signup Flow

1. Deploy your application to Vercel
2. Set the `NEXT_PUBLIC_SITE_URL` environment variable
3. Test the signup process with a real email address
4. Verify the confirmation email redirects to your production URL