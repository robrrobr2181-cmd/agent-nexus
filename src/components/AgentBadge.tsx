import { Brain, Search, Workflow, GraduationCap, Sparkles } from "lucide-react";
import { AgentType } from "@/types";
import { cn } from "@/lib/utils";

interface AgentBadgeProps {
  agent: AgentType;
  className?: string;
}

const agentConfig = {
  concierge: {
    icon: Sparkles,
    label: "Concierge",
    color: "text-agent-concierge",
    bg: "bg-agent-concierge/10",
    border: "border-agent-concierge/30",
  },
  search: {
    icon: Search,
    label: "Search",
    color: "text-agent-search",
    bg: "bg-agent-search/10",
    border: "border-agent-search/30",
  },
  workflow: {
    icon: Workflow,
    label: "Workflow",
    color: "text-agent-workflow",
    bg: "bg-agent-workflow/10",
    border: "border-agent-workflow/30",
  },
  expert: {
    icon: GraduationCap,
    label: "Expert",
    color: "text-agent-expert",
    bg: "bg-agent-expert/10",
    border: "border-agent-expert/30",
  },
  orchestrator: {
    icon: Brain,
    label: "AI Assistant",
    color: "text-primary",
    bg: "bg-primary/10",
    border: "border-primary/30",
  },
};

export const AgentBadge = ({ agent, className }: AgentBadgeProps) => {
  const config = agentConfig[agent];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium transition-all",
        config.bg,
        config.border,
        config.color,
        className
      )}
    >
      <Icon className="w-3 h-3" />
      {config.label}
    </div>
  );
};
