import { SaveStatusBadge } from '@/components/emergency/SaveStatusBadge';
import type { SaveStatus } from '@/hooks/useAutoSave';

interface EmergencyPageHeaderProps {
  saveStatus: SaveStatus;
}

/** Page header with title, subtitle, and inline save status badge. */
export function EmergencyPageHeader({ saveStatus }: EmergencyPageHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h2 className="text-3xl font-bold text-foreground">
          Dati di emergenza
        </h2>
        <p className="mt-2 text-muted-foreground">
          Salva i contatti importanti. Saranno cifrati sul tuo dispositivo.
        </p>
      </div>
      <SaveStatusBadge status={saveStatus} />
    </div>
  );
}
