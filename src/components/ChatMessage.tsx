import { Message } from "@/types";
import { AgentBadge } from "./AgentBadge";
import { User, Bot } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatMessageProps {
  message: Message;
}

export const ChatMessage = ({ message }: ChatMessageProps) => {
  return (
    <div
      className={cn(
        "flex gap-4 p-4 rounded-lg transition-all animate-in fade-in slide-in-from-bottom-3 duration-300",
        message.isUser ? "bg-muted/50" : "bg-card/50 backdrop-blur-sm"
      )}
    >
      <div
        className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
          message.isUser
            ? "bg-primary text-primary-foreground"
            : "bg-gradient-primary"
        )}
      >
        {message.isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>
      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-2">
          {!message.isUser && <AgentBadge agent={message.agent} />}
          <span className="text-xs text-muted-foreground">
            {message.timestamp.toLocaleTimeString()}
          </span>
        </div>
        <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">
          {message.content}
        </p>
      </div>
    </div>
  );
};
