import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import Checkbox from '@mui/material/Checkbox';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import type { Ingredient } from '../../types';

const statusColor: Record<Ingredient['status'], 'success' | 'warning' | 'error' | 'default'> = {
  in_stock: 'success',
  low: 'warning',
  out_of_stock: 'error',
  discontinued: 'default',
};

const statusLabel: Record<Ingredient['status'], string> = {
  in_stock: 'In Stock',
  low: 'Low',
  out_of_stock: 'Out',
  discontinued: 'Discontinued',
};

interface Props {
  ingredient: Ingredient;
  onClick: (id: string) => void;
  selected: boolean;
  onToggleSelect: (id: string) => void;
  /** Bumps quantity by `delta` (e.g. -1 or +1) without navigating to the detail page. */
  onQuantityChange?: (id: string, delta: number) => void;
}

export default function ItemRow({
  ingredient,
  onClick,
  selected,
  onToggleSelect,
  onQuantityChange,
}: Props) {
  const isExpired = Boolean(
    ingredient.expirationDate && ingredient.expirationDate.toDate() < new Date()
  );

  return (
    <TableRow
      hover
      selected={selected}
      onClick={() => onClick(ingredient.id)}
      sx={{ cursor: 'pointer' }}
    >
      <TableCell padding="checkbox">
        <Checkbox
          checked={selected}
          onClick={(e) => e.stopPropagation()}
          onChange={() => onToggleSelect(ingredient.id)}
        />
      </TableCell>
      <TableCell>{ingredient.name}</TableCell>
      <TableCell>{ingredient.brand}</TableCell>
      <TableCell>{ingredient.category}</TableCell>
      <TableCell sx={{ whiteSpace: 'nowrap' }}>
        <IconButton
          size="small"
          aria-label={`Decrease ${ingredient.name} quantity`}
          disabled={ingredient.quantity <= 0}
          onClick={(e) => {
            e.stopPropagation();
            onQuantityChange?.(ingredient.id, -1);
          }}
        >
          <RemoveIcon fontSize="inherit" />
        </IconButton>
        {ingredient.quantity} {ingredient.unit}
        <IconButton
          size="small"
          aria-label={`Increase ${ingredient.name} quantity`}
          onClick={(e) => {
            e.stopPropagation();
            onQuantityChange?.(ingredient.id, 1);
          }}
        >
          <AddIcon fontSize="inherit" />
        </IconButton>
      </TableCell>
      <TableCell sx={isExpired ? { color: 'error.main' } : undefined}>
        {ingredient.expirationDate ? ingredient.expirationDate.toDate().toLocaleDateString() : '—'}
      </TableCell>
      <TableCell>
        <Chip
          label={statusLabel[ingredient.status]}
          color={statusColor[ingredient.status]}
          size="small"
        />
      </TableCell>
      <TableCell>{ingredient.addedByName || '—'}</TableCell>
    </TableRow>
  );
}
