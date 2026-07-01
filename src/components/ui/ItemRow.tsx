import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
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
}

export default function ItemRow({ ingredient, onClick }: Props) {
  return (
    <TableRow
      hover
      onClick={() => onClick(ingredient.id)}
      sx={{ cursor: 'pointer' }}
    >
      <TableCell>{ingredient.name}</TableCell>
      <TableCell>{ingredient.brand}</TableCell>
      <TableCell>{ingredient.category}</TableCell>
      <TableCell>
        {ingredient.quantity} {ingredient.unit}
      </TableCell>
      <TableCell>
        <Chip
          label={statusLabel[ingredient.status]}
          color={statusColor[ingredient.status]}
          size="small"
        />
      </TableCell>
    </TableRow>
  );
}
