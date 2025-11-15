# 🚀 Multi-Agent AI Assistant - Setup Guide

## Prerequisites

- Node.js 18+ and npm
- Firebase CLI: `npm install -g firebase-tools`
- A Firebase project (create at [console.firebase.google.com](https://console.firebase.google.com))

## 📦 Initial Setup

### 1. Firebase Project Setup

```bash
# Login to Firebase
firebase login

# Initialize Firebase in this directory
firebase init

# Select the following services:
# - Firestore
# - Functions
# - Hosting
# - Storage

# Choose your existing Firebase project or create a new one
```

### 2. Configure Environment Variables

```bash
# Copy the example environment file
cp .env.example .env.local

# Get your Firebase config from:
# Firebase Console > Project Settings > General > Your apps > Config

# Update .env.local with your Firebase credentials
```

### 3. Install Dependencies

```bash
# Install frontend dependencies
npm install

# Install Firebase Functions dependencies
cd firebase-functions
npm install
cd ..
```

### 4. Enable Firebase Services

In Firebase Console, enable:

1. **Authentication**
   - Go to Authentication > Sign-in method
   - Enable "Email/Password"
   - Enable "Google" (configure OAuth consent screen)

2. **Firestore Database**
   - Go to Firestore Database
   - Create database in production mode
   - Deploy security rules: `firebase deploy --only firestore:rules`

3. **Cloud Storage**
   - Go to Storage
   - Get started with default bucket
   - Deploy security rules: `firebase deploy --only storage`

4. **Cloud Functions**
   - Functions will be deployed in next step

## 🏃 Running Locally

### Option 1: With Firebase Emulators (Recommended for Development)

```bash
# Start all Firebase emulators
firebase emulators:start

# In a new terminal, start the React app
npm run dev
```

The app will use local emulators for all Firebase services.

### Option 2: Connected to Production Firebase

```bash
# Just start the React app
npm run dev
```

This connects directly to your Firebase project.

## 🌐 Deploying to Production

### 1. Build the React App

```bash
npm run build
```

### 2. Deploy Everything

```bash
# Deploy all Firebase services
firebase deploy

# Or deploy specific services:
firebase deploy --only functions    # Cloud Functions only
firebase deploy --only hosting      # Hosting only
firebase deploy --only firestore    # Firestore rules only
firebase deploy --only storage      # Storage rules only
```

### 3. Access Your App

After deployment, Firebase will provide:
- **Hosting URL**: `https://your-project-id.web.app`
- **Functions URL**: `https://us-central1-your-project-id.cloudfunctions.net`

## 🔧 Configuration

### Update Firestore Indexes

If you encounter index errors:

1. Firebase will log the required index URL
2. Click the URL or go to: Firestore Database > Indexes
3. The index will be automatically created

### Configure CORS (if needed)

For Functions CORS issues:

```bash
# In firebase-functions/index.js, CORS headers are already configured
# If issues persist, check Firebase Console > Functions > Logs
```

## 📱 Features to Implement (Production)

The current setup is a working demo. For production:

### 1. Integrate Real LLM APIs

Replace simulated agent responses in `firebase-functions/index.js`:

```javascript
// Example: OpenAI Integration
const { Configuration, OpenAIApi } = require("openai");

const openai = new OpenAIApi(
  new Configuration({ apiKey: functions.config().openai.key })
);

agents.concierge = async (prompt) => {
  const completion = await openai.createChatCompletion({
    model: "gpt-4",
    messages: [{ role: "user", content: prompt }]
  });
  
  return {
    response: completion.data.choices[0].message.content,
    agent: "concierge"
  };
};
```

### 2. Document Search with Embeddings

```bash
# Install vector search libraries
cd firebase-functions
npm install @pinecone-database/pinecone openai
```

Implement in `indexDocument` function:
- Extract text from PDFs/docs
- Generate embeddings
- Store in vector database (Pinecone, Weaviate, etc.)
- Implement semantic search

### 3. Advanced Intent Classification

Replace keyword matching with proper NLP:

```javascript
// Use a classification model to route to agents
const classifyIntent = async (prompt) => {
  // Call classification API
  // Return: { agent: 'concierge', confidence: 0.95 }
};
```

## 🔐 Security Best Practices

1. **Never commit `.env.local`** - It's gitignored by default
2. **Review Firestore/Storage rules** - Ensure proper user isolation
3. **Set up Firebase App Check** - Protect against abuse
4. **Enable Function Secret Manager** - For API keys
5. **Monitor usage** - Set up billing alerts

## 🐛 Troubleshooting

### Firebase Auth Errors

```bash
# Check auth configuration
firebase auth:export users.json --project your-project-id
```

### Function Deployment Fails

```bash
# Check function logs
firebase functions:log

# Test functions locally
firebase emulators:start --only functions
```

### Firestore Permission Denied

- Verify security rules are deployed
- Check user authentication
- Review Firestore indexes

## 📚 Additional Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [React + Firebase Guide](https://firebase.google.com/docs/web/setup)
- [Cloud Functions Docs](https://firebase.google.com/docs/functions)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)

## 🎯 Next Steps

1. Set up CI/CD with GitHub Actions
2. Implement proper error handling
3. Add comprehensive logging
4. Set up monitoring (Firebase Performance)
5. Implement rate limiting
6. Add user analytics

---

**Need Help?** Check Firebase Console > Support or [Stack Overflow](https://stackoverflow.com/questions/tagged/firebase)
