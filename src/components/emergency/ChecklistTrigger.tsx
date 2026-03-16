import { ClipboardList } from 'lucide-react';

interface ChecklistTriggerProps {
  completedCount: number;
  onClick: () => void;
}

/** Button that opens the checklist bottom sheet, with completion status. */
export function ChecklistTrigger({ completedCount, onClick }: ChecklistTriggerProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between rounded-2xl border border-slate-700/50
                 bg-white/5 px-5 py-4 text-left transition-colors hover:bg-white/10"
      style={{ minHeight: 44 }}
      aria-label="Apri checklist azioni anti-truffa"
    >
      <div className="flex items-center gap-3">
        <ClipboardList
          className="h-5 w-5 shrink-0 text-cyan-brand"
          aria-hidden="true"
        />
        <div>
          <p className="text-base font-medium text-foreground">
            Checklist azioni
          </p>
          <p className="text-sm text-muted-foreground">
            {completedCount > 0
              ? `${completedCount} azioni completate`
              : 'Cosa fare adesso, passo per passo'}
          </p>
        </div>
      </div>
      <span className="text-xs text-muted-foreground">Apri →</span>
    </button>
  );
}
