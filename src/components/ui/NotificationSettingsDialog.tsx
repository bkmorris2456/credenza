import { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

interface Props {
  open: boolean;
  initialDays: number;
  onClose: () => void;
  onSave: (days: number) => Promise<void>;
}

/** Lets the user set how many days in advance an expiring ingredient shows up in the expiry notification. */
export default function NotificationSettingsDialog({ open, initialDays, onClose, onSave }: Props) {
  const [days, setDays] = useState(String(initialDays));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    const parsed = Number(days);
    if (!Number.isFinite(parsed) || parsed < 0) {
      setError('Enter a whole number of days, 0 or greater.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave(Math.round(parsed));
      onClose();
    } catch (err) {
      console.error('[NotificationSettingsDialog] save failed:', err);
      setError('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Expiration Notifications</DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ mb: 2 }}>
          Show a warning when an ingredient is this many days from expiring.
        </Typography>
        <TextField
          label="Days in advance"
          type="number"
          fullWidth
          value={days}
          onChange={(e) => setDays(e.target.value)}
          disabled={saving}
          slotProps={{ htmlInput: { min: 0 } }}
        />
        {error && (
          <Typography color="error" variant="caption" sx={{ display: 'block', mt: 1 }}>
            {error}
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={saving} variant="contained">
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}
