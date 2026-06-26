import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import type { TimerSettings } from "@/lib/timer-state";

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
  settings: TimerSettings;
  onSave: (s: TimerSettings) => void;
}

export default function SettingsModal({ open, onClose, settings, onSave }: SettingsModalProps) {
  const [local, setLocal] = useState(settings);
  useEffect(() => { if (open) setLocal(settings); }, [open, settings]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm bg-background">
        <DialogHeader>
          <DialogTitle className="text-foreground">Timer-Einstellungen</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div>
            <label className="text-sm text-muted-foreground">Fokuszeit: {local.focusMinutes} Min</label>
            <Slider value={[local.focusMinutes]} onValueChange={([v]) => setLocal({ ...local, focusMinutes: v })} min={5} max={60} step={5} className="mt-2" />
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Kurze Pause: {local.shortBreakMinutes} Min</label>
            <Slider value={[local.shortBreakMinutes]} onValueChange={([v]) => setLocal({ ...local, shortBreakMinutes: v })} min={1} max={15} step={1} className="mt-2" />
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Lange Pause: {local.longBreakMinutes} Min</label>
            <Slider value={[local.longBreakMinutes]} onValueChange={([v]) => setLocal({ ...local, longBreakMinutes: v })} min={5} max={30} step={5} className="mt-2" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-foreground">Auto-Start nächste Session</span>
            <Switch checked={local.autoStart} onCheckedChange={(v) => setLocal({ ...local, autoStart: v })} />
          </div>
          <button
            onClick={() => { onSave(local); onClose(); }}
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-medium"
          >
            Speichern
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
