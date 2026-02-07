import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Bell, BellOff, Clock } from 'lucide-react';
import { toast } from 'sonner';

export interface TaskReminder {
  taskId: string;
  type: 'once' | 'daily' | 'weekly';
  time: string; // HH:MM
  day?: number; // 0-6 for weekly
  enabled: boolean;
  snoozedUntil?: string;
}

const REMINDERS_KEY = 'lumatha_task_reminders';

export function getReminders(): Record<string, TaskReminder> {
  const saved = localStorage.getItem(REMINDERS_KEY);
  return saved ? JSON.parse(saved) : {};
}

export function saveReminder(reminder: TaskReminder) {
  const all = getReminders();
  all[reminder.taskId] = reminder;
  localStorage.setItem(REMINDERS_KEY, JSON.stringify(all));
}

export function removeReminder(taskId: string) {
  const all = getReminders();
  delete all[taskId];
  localStorage.setItem(REMINDERS_KEY, JSON.stringify(all));
}

export function snoozeReminder(taskId: string, minutes: number) {
  const all = getReminders();
  if (all[taskId]) {
    all[taskId].snoozedUntil = new Date(Date.now() + minutes * 60 * 1000).toISOString();
    localStorage.setItem(REMINDERS_KEY, JSON.stringify(all));
  }
}

interface TodoReminderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskId: string;
  taskText: string;
}

export function TodoReminderDialog({ open, onOpenChange, taskId, taskText }: TodoReminderDialogProps) {
  const existing = getReminders()[taskId];
  const [type, setType] = useState<'once' | 'daily' | 'weekly'>(existing?.type || 'daily');
  const [time, setTime] = useState(existing?.time || '09:00');
  const [day, setDay] = useState(existing?.day || 1);

  const handleSave = () => {
    saveReminder({ taskId, type, time, day: type === 'weekly' ? day : undefined, enabled: true });
    
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
    
    toast.success(`Reminder set: ${type === 'once' ? 'One-time' : type === 'daily' ? 'Daily' : 'Weekly'} at ${time}`);
    onOpenChange(false);
  };

  const handleRemove = () => {
    removeReminder(taskId);
    toast.success('Reminder removed');
    onOpenChange(false);
  };

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Set Reminder
          </DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground line-clamp-2">{taskText}</p>

        <div className="space-y-4 pt-2">
          <div>
            <Label className="text-sm mb-2 block">Repeat</Label>
            <RadioGroup value={type} onValueChange={(v) => setType(v as any)} className="flex gap-3">
              <div className="flex items-center gap-1.5">
                <RadioGroupItem value="once" id="r-once" />
                <Label htmlFor="r-once" className="text-sm cursor-pointer">One-time</Label>
              </div>
              <div className="flex items-center gap-1.5">
                <RadioGroupItem value="daily" id="r-daily" />
                <Label htmlFor="r-daily" className="text-sm cursor-pointer">Daily</Label>
              </div>
              <div className="flex items-center gap-1.5">
                <RadioGroupItem value="weekly" id="r-weekly" />
                <Label htmlFor="r-weekly" className="text-sm cursor-pointer">Weekly</Label>
              </div>
            </RadioGroup>
          </div>

          <div>
            <Label className="text-sm mb-2 block">Time</Label>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="w-32" />
            </div>
          </div>

          {type === 'weekly' && (
            <div>
              <Label className="text-sm mb-2 block">Day</Label>
              <div className="flex gap-1.5">
                {days.map((d, i) => (
                  <Button
                    key={d}
                    size="sm"
                    variant={day === i ? 'default' : 'outline'}
                    className="h-8 w-9 p-0 text-xs"
                    onClick={() => setDay(i)}
                  >
                    {d}
                  </Button>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            {existing && (
              <Button variant="outline" className="flex-1 text-destructive" onClick={handleRemove}>
                <BellOff className="w-4 h-4 mr-1" />
                Remove
              </Button>
            )}
            <Button className="flex-1" onClick={handleSave}>
              <Bell className="w-4 h-4 mr-1" />
              {existing ? 'Update' : 'Set Reminder'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
