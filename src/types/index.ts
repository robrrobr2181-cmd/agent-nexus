export type AgentType = 'concierge' | 'search' | 'workflow' | 'expert' | 'orchestrator';

export interface Message {
  id: string;
  userId: string;
  content: string;
  agent: AgentType;
  timestamp: Date;
  isUser: boolean;
}

export interface Document {
  id: string;
  name: string;
  url: string;
  uploadedAt: Date;
  userId: string;
  size: number;
  type: string;
}

export interface Task {
  id: string;
  userId: string;
  title: string;
  description: string;
  dueDate?: Date;
  completed: boolean;
  createdAt: Date;
  agent: AgentType;
}
