import { useState, useEffect, useRef } from "react";
import { User } from "firebase/auth";
import { collection, addDoc, query, where, orderBy, onSnapshot, deleteDoc, doc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { httpsCallable } from "firebase/functions";
import { db, storage, functions } from "@/config/firebase";
import { Message, Document } from "@/types";
import { ChatMessage } from "@/components/ChatMessage";
import { ChatInput } from "@/components/ChatInput";
import { DocumentPanel } from "@/components/DocumentPanel";
import { Button } from "@/components/ui/button";
import { LogOut, Bot } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ChatProps {
  user: User;
  onLogout: () => void;
}

export const Chat = ({ user, onLogout }: ChatProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    const messagesQuery = query(
      collection(db, "messages"),
      where("userId", "==", user.uid),
      orderBy("timestamp", "asc")
    );

    const unsubscribeMessages = onSnapshot(messagesQuery, (snapshot) => {
      const msgs: Message[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date(),
      })) as Message[];
      setMessages(msgs);
    });

    const documentsQuery = query(
      collection(db, "documents"),
      where("userId", "==", user.uid),
      orderBy("uploadedAt", "desc")
    );

    const unsubscribeDocuments = onSnapshot(documentsQuery, (snapshot) => {
      const docs: Document[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        uploadedAt: doc.data().uploadedAt?.toDate() || new Date(),
      })) as Document[];
      setDocuments(docs);
    });

    return () => {
      unsubscribeMessages();
      unsubscribeDocuments();
    };
  }, [user.uid]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (content: string) => {
    const userMessage: Omit<Message, "id"> = {
      userId: user.uid,
      content,
      agent: "orchestrator",
      timestamp: new Date(),
      isUser: true,
    };

    await addDoc(collection(db, "messages"), userMessage);

    try {
      const orchestrateAgents = httpsCallable(functions, "orchestrateAgents");
      const result = await orchestrateAgents({ prompt: content, userId: user.uid });
      const response = result.data as { response: string; agent: string };

      const aiMessage: Omit<Message, "id"> = {
        userId: user.uid,
        content: response.response,
        agent: response.agent as any,
        timestamp: new Date(),
        isUser: false,
      };

      await addDoc(collection(db, "messages"), aiMessage);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to get AI response",
        variant: "destructive",
      });
    }
  };

  const handleUploadDocument = async (file: File) => {
    const storageRef = ref(storage, `documents/${user.uid}/${Date.now()}_${file.name}`);
    const snapshot = await uploadBytes(storageRef, file);
    const url = await getDownloadURL(snapshot.ref);

    await addDoc(collection(db, "documents"), {
      userId: user.uid,
      name: file.name,
      url,
      size: file.size,
      type: file.type,
      uploadedAt: new Date(),
    });
  };

  const handleDeleteDocument = async (id: string) => {
    const document = documents.find((d) => d.id === id);
    if (!document) return;

    const storageRef = ref(storage, document.url);
    await deleteObject(storageRef);
    await deleteDoc(doc(db, "documents", id));
  };

  return (
    <div className="flex h-screen bg-gradient-subtle">
      <div className="flex-1 flex flex-col">
        <header className="bg-card/50 backdrop-blur-sm border-b border-border p-4">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Multi-Agent AI Assistant</h1>
                <p className="text-xs text-muted-foreground">Powered by specialized agents</p>
              </div>
            </div>
            <Button variant="outline" onClick={onLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="max-w-5xl mx-auto space-y-4">
            {messages.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-20 h-20 rounded-full bg-gradient-primary mx-auto mb-4 flex items-center justify-center shadow-glow">
                  <Bot className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-2xl font-bold mb-2 text-foreground">Welcome to Your AI Assistant</h2>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Ask me anything! I'll automatically route your question to the most appropriate specialized agent.
                </p>
              </div>
            ) : (
              messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        <div className="border-t border-border bg-card/30 backdrop-blur-sm p-4">
          <div className="max-w-5xl mx-auto">
            <ChatInput onSendMessage={handleSendMessage} />
          </div>
        </div>
      </div>

      <div className="w-80 hidden lg:block">
        <DocumentPanel
          documents={documents}
          onUpload={handleUploadDocument}
          onDelete={handleDeleteDocument}
        />
      </div>
    </div>
  );
};
