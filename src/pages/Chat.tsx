import { useState, useEffect, useRef } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Message, Document, AgentType } from "@/types";
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
    // Load messages
    const loadMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading messages:', error);
        return;
      }

      setMessages(data.map(msg => ({
        id: msg.id,
        userId: msg.user_id,
        content: msg.content,
        agent: (msg.agent_type || 'orchestrator') as AgentType,
        timestamp: new Date(msg.created_at),
        isUser: msg.role === 'user',
      })));
    };

    // Load documents
    const loadDocuments = async () => {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading documents:', error);
        return;
      }

      setDocuments(data.map(doc => ({
        id: doc.id,
        userId: doc.user_id,
        name: doc.name,
        url: doc.file_url,
        size: 0, // Not stored in new schema
        type: doc.file_type,
        uploadedAt: new Date(doc.created_at),
      })));
    };

    loadMessages();
    loadDocuments();

    // Set up realtime subscriptions
    const messagesSubscription = supabase
      .channel('messages-channel')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'messages',
        filter: `user_id=eq.${user.id}`
      }, () => {
        loadMessages();
      })
      .subscribe();

    const documentsSubscription = supabase
      .channel('documents-channel')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'documents',
        filter: `user_id=eq.${user.id}`
      }, () => {
        loadDocuments();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(messagesSubscription);
      supabase.removeChannel(documentsSubscription);
    };
  }, [user.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (content: string) => {
    // Add user message
    const { error: userMsgError } = await supabase
      .from('messages')
      .insert({
        user_id: user.id,
        content,
        role: 'user',
        agent_type: null,
      });

    if (userMsgError) {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
      return;
    }

    try {
      // Call AI orchestrator edge function
      const { data, error } = await supabase.functions.invoke('orchestrate-agents', {
        body: { prompt: content, userId: user.id }
      });

      if (error) throw error;

      // Add AI response
      await supabase
        .from('messages')
        .insert({
          user_id: user.id,
          content: data.response,
          role: 'assistant',
          agent_type: data.agent,
        });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to get AI response",
        variant: "destructive",
      });
    }
  };

  const handleUploadDocument = async (file: File) => {
    try {
      // Upload to storage
      const filePath = `${user.id}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      // Save to database
      const { error: dbError } = await supabase
        .from('documents')
        .insert({
          user_id: user.id,
          name: file.name,
          file_url: publicUrl,
          file_type: file.type,
        });

      if (dbError) throw dbError;

      toast({
        title: "Success",
        description: "Document uploaded successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to upload document",
        variant: "destructive",
      });
    }
  };

  const handleDeleteDocument = async (id: string) => {
    const document = documents.find((d) => d.id === id);
    if (!document) return;

    try {
      // Extract file path from URL
      const urlParts = document.url.split('/');
      const filePath = urlParts.slice(urlParts.indexOf('documents') + 1).join('/');

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('documents')
        .remove([filePath]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('documents')
        .delete()
        .eq('id', id);

      if (dbError) throw dbError;

      toast({
        title: "Success",
        description: "Document deleted successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete document",
        variant: "destructive",
      });
    }
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
