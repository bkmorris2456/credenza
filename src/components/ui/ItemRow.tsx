import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import Checkbox from '@mui/material/Checkbox';
import Chip from '@mui/material/Chip';
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
  selectable?: boolean;
  selected?: boolean;
  onToggleSelect?: (id: string) => void;
}

export default function ItemRow({ ingredient, onClick, selectable, selected, onToggleSelect }: Props) {
  const isExpired = Boolean(
    ingredient.expirationDate && ingredient.expirationDate.toDate() < new Date()
  );

  return (
    <TableRow
      hover
      selected={selected}
      onClick={() => (selectable ? onToggleSelect?.(ingredient.id) : onClick(ingredient.id))}
      sx={{ cursor: 'pointer' }}
    >
      {selectable && (
        <TableCell padding="checkbox">
          <Checkbox
            checked={Boolean(selected)}
            onClick={(e) => e.stopPropagation()}
            onChange={() => onToggleSelect?.(ingredient.id)}
          />
        </TableCell>
      )}
      <TableCell>{ingredient.name}</TableCell>
      <TableCell>{ingredient.brand}</TableCell>
      <TableCell>{ingredient.category}</TableCell>
      <TableCell>
        {ingredient.quantity} {ingredient.unit}
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
