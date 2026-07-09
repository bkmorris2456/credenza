import { useState, type KeyboardEvent } from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';

const ADD_NEW = '__add_new__';

interface SelectWithAddProps {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  /** Persist a brand-new option. Resolving it commits `value` to the new name. */
  onCreate: (name: string) => Promise<void>;
  fullWidth?: boolean;
}

/** A select dropdown with a trailing "Add new" entry that swaps in an inline text field to create an option on the spot. */
export default function SelectWithAdd({
  label,
  value,
  options,
  onChange,
  onCreate,
  fullWidth,
}: SelectWithAddProps) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSelectChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value === ADD_NEW) {
      setDraft('');
      setError(null);
      setAdding(true);
    } else {
      onChange(e.target.value);
    }
  };

  const handleConfirm = async () => {
    const name = draft.trim();
    if (!name || saving) return;
    setSaving(true);
    setError(null);
    try {
      await onCreate(name);
      setAdding(false);
    } catch (err) {
      console.error('[SelectWithAdd] failed to create option:', err);
      setError(`Failed to add "${name}". Please try again.`);
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleConfirm();
    }
  };

  if (adding) {
    return (
      <Box sx={{ flex: 1 }}>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <TextField
            label={`New ${label}`}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
            fullWidth
            disabled={saving}
          />
          <IconButton
            type="button"
            aria-label={`Save new ${label}`}
            onClick={handleConfirm}
            disabled={saving || !draft.trim()}
          >
            <CheckIcon />
          </IconButton>
          <IconButton
            type="button"
            aria-label="Cancel"
            onClick={() => setAdding(false)}
            disabled={saving}
          >
            <CloseIcon />
          </IconButton>
        </Box>
        {error && (
          <Typography color="error" variant="caption">
            {error}
          </Typography>
        )}
      </Box>
    );
  }

  return (
    <TextField
      select
      label={label}
      value={value}
      onChange={handleSelectChange}
      fullWidth={fullWidth}
      sx={fullWidth ? undefined : { flex: 1 }}
    >
      <MenuItem value="">
        <em>None</em>
      </MenuItem>
      {options.map((opt) => (
        <MenuItem key={opt} value={opt}>
          {opt}
        </MenuItem>
      ))}
      <Divider />
      <MenuItem value={ADD_NEW}>
        <AddIcon fontSize="small" sx={{ mr: 1 }} />
        Add new {label.toLowerCase()}
      </MenuItem>
    </TextField>
  );
}
