import { useState, type ReactNode } from 'react';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import Button from '@mui/material/Button';
import FilterListIcon from '@mui/icons-material/FilterList';

interface Props {
  active: boolean;
  onClear: () => void;
  children: ReactNode;
}

/** Filter icon button that opens a popover of filter controls for a single table column. */
export default function ColumnFilterMenu({ active, onClear, children }: Props) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  return (
    <>
      <IconButton
        size="small"
        color={active ? 'primary' : 'default'}
        onClick={(e) => setAnchorEl(e.currentTarget)}
        aria-label="Filter column"
      >
        <FilterListIcon fontSize="inherit" />
      </IconButton>
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
        <Box sx={{ p: 2, minWidth: 220, display: 'flex', flexDirection: 'column', gap: 1 }}>
          {children}
          <Button size="small" onClick={onClear} disabled={!active}>
            Clear filter
          </Button>
        </Box>
      </Menu>
    </>
  );
}
