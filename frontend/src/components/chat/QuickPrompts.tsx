import {
  BookOpen,
  GitCompareArrows,
  HelpCircle,
  Lightbulb,
  FileQuestion,
} from "lucide-react";

const ICON_MAP: Record<string, React.ElementType> = {
  BookOpen,
  GitCompare: GitCompareArrows,
  HelpCircle,
  Lightbulb,
  FileQuestion,
};

interface Prompt {
  id: string;
  label: string;
  icon: string;
  template: string;
}

interface Props {
  prompts: Prompt[];
  onSelect: (template: string) => void;
}

export default function QuickPrompts({ prompts, onSelect }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      {prompts.map((prompt) => {
        const Icon = ICON_MAP[prompt.icon] ?? BookOpen;
        return (
          <button
            key={prompt.id}
            onClick={() => onSelect(prompt.template)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full
                       bg-white border border-border text-xs text-text-secondary
                       hover:border-primary hover:text-primary hover:bg-primary-light
                       transition-colors shadow-sm"
          >
            <Icon className="w-3.5 h-3.5" />
            {prompt.label}
          </button>
        );
      })}
    </div>
  );
}
