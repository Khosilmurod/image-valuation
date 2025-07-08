# Vercel Deployment Guide

## Prerequisites

1. **MongoDB Atlas Account**: Sign up at [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)

## Setup Steps

### 1. Setup MongoDB Atlas

1. Create a new cluster in MongoDB Atlas
2. Create a database user with read/write permissions
3. Get your connection string (it should look like: `mongodb+srv://username:password@cluster.mongodb.net/database`)
4. Make sure to whitelist all IP addresses (0.0.0.0/0) for Vercel's serverless functions

### 2. Deploy to Vercel

#### Option A: Via Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variable
vercel env add MONGODB_URI
# Paste your MongoDB connection string when prompted
```

#### Option B: Via GitHub Integration
1. Push your code to GitHub
2. Connect your GitHub repo to Vercel
3. Go to your project settings in Vercel dashboard
4. Add environment variable:
   - Name: `MONGODB_URI`
   - Value: Your MongoDB connection string

### 3. Environment Variables

Set these in your Vercel project dashboard:

- **MONGODB_URI**: Your MongoDB Atlas connection string
  ```
  mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority
  ```

### 4. Verification

After deployment:
1. Visit your Vercel URL
2. Test the experiment functionality
3. Check that data is being saved to MongoDB

## API Endpoints

- `GET /api/config` - Returns experiment configuration
- `POST /api/save` - Saves experiment data to MongoDB

## Key Changes for Vercel

1. **Serverless Functions**: The original Express server has been converted to individual API routes
2. **Database Connections**: MongoDB connections are cached for serverless functions
3. **Static Files**: All frontend files are served from the `public/` directory
4. **Environment Variables**: MongoDB URI is now configurable via Vercel environment variables

## Troubleshooting

### Common Issues:

1. **502 Bad Gateway**: Usually means MongoDB connection failed
   - Check your MONGODB_URI environment variable
   - Ensure IP whitelisting allows 0.0.0.0/0

2. **Function Timeout**: If you get timeout errors
   - Check MongoDB Atlas network settings
   - Verify database user permissions

3. **CORS Issues**: If frontend can't reach API
   - Check that API routes are working: visit `/api/config` directly
   - Ensure routes are properly configured in `vercel.json`

### Testing Locally:

```bash
# Install Vercel CLI
npm i -g vercel

# Create .env file with your MongoDB URI
echo "MONGODB_URI=your_connection_string_here" > .env

# Run local development
vercel dev
```

## Production URL

After deployment, your experiment will be available at:
`https://your-project-name.vercel.app` 