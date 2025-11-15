// Firebase Cloud Functions - Multi-Agent Orchestrator
// Deploy with: firebase deploy --only functions

const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

// Simulated agent responses - Replace with actual LLM API calls
const agents = {
  concierge: async (prompt) => {
    return {
      response: `🌟 Concierge Agent: I can help plan your ${prompt}. Let me create a personalized itinerary for you.`,
      agent: "concierge"
    };
  },
  
  search: async (prompt, userId) => {
    const documentsRef = admin.firestore().collection("documents");
    const snapshot = await documentsRef.where("userId", "==", userId).get();
    
    return {
      response: `🔍 Search Agent: I found ${snapshot.size} documents in your knowledge base related to "${prompt}".`,
      agent: "search"
    };
  },
  
  workflow: async (prompt, userId) => {
    const taskData = {
      userId,
      title: `Task from: ${prompt}`,
      description: "Auto-generated task",
      completed: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      agent: "workflow"
    };
    
    await admin.firestore().collection("tasks").add(taskData);
    
    return {
      response: `✅ Workflow Agent: I've created a task for "${prompt}". I'll handle the automation.`,
      agent: "workflow"
    };
  },
  
  expert: async (prompt) => {
    return {
      response: `🎓 Expert Agent: Based on my expertise, regarding "${prompt}", I recommend following industry best practices and consulting relevant regulations.`,
      agent: "expert"
    };
  }
};

// Orchestrator function - Routes prompts to appropriate agents
exports.orchestrateAgents = functions.https.onCall(async (data, context) => {
  // Require authentication
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "User must be authenticated"
    );
  }

  const { prompt, userId } = data;

  if (!prompt) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Prompt is required"
    );
  }

  // Simple routing logic - Replace with actual intent classification
  const lowerPrompt = prompt.toLowerCase();
  
  try {
    if (lowerPrompt.includes("plan") || lowerPrompt.includes("recommend") || lowerPrompt.includes("suggest")) {
      return await agents.concierge(prompt);
    } else if (lowerPrompt.includes("search") || lowerPrompt.includes("find") || lowerPrompt.includes("document")) {
      return await agents.search(prompt, userId);
    } else if (lowerPrompt.includes("task") || lowerPrompt.includes("reminder") || lowerPrompt.includes("schedule")) {
      return await agents.workflow(prompt, userId);
    } else if (lowerPrompt.includes("expert") || lowerPrompt.includes("advice") || lowerPrompt.includes("legal") || lowerPrompt.includes("finance")) {
      return await agents.expert(prompt);
    } else {
      // Default orchestrator response
      return {
        response: `🤖 AI Assistant: I understand you're asking about "${prompt}". Let me help you with that. (This is a demo response - integrate with actual LLM APIs for production)`,
        agent: "orchestrator"
      };
    }
  } catch (error) {
    console.error("Agent error:", error);
    throw new functions.https.HttpsError(
      "internal",
      "Failed to process request"
    );
  }
});

// Function to index documents for search (called on document upload)
exports.indexDocument = functions.firestore
  .document("documents/{documentId}")
  .onCreate(async (snap, context) => {
    const document = snap.data();
    
    // In production: 
    // 1. Download document from Storage
    // 2. Extract text content
    // 3. Generate embeddings
    // 4. Store in vector database
    
    console.log("Document indexed:", document.name);
    return null;
  });

// Function to handle scheduled tasks
exports.processScheduledTasks = functions.pubsub
  .schedule("every 5 minutes")
  .onRun(async (context) => {
    const now = admin.firestore.Timestamp.now();
    const tasksRef = admin.firestore().collection("tasks");
    
    const snapshot = await tasksRef
      .where("completed", "==", false)
      .where("dueDate", "<=", now)
      .get();
    
    console.log(`Processing ${snapshot.size} due tasks`);
    
    // Process tasks (send notifications, trigger workflows, etc.)
    
    return null;
  });
