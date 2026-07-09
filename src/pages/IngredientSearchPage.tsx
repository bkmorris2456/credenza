import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TablePagination from '@mui/material/TablePagination';
import Paper from '@mui/material/Paper';
import Fab from '@mui/material/Fab';
import AddIcon from '@mui/icons-material/Add';
import CircularProgress from '@mui/material/CircularProgress';
import SearchBar from '../components/ui/SearchBar';
import LowStockToast from '../components/ui/LowStockToast';
import ItemRow from '../components/ui/ItemRow';
import { getIngredients } from '../services/ingredientService';
import { useHousehold } from '../contexts/HouseholdContext';
import type { Ingredient } from '../types';

export default function IngredientSearchPage() {
  const navigate = useNavigate();
  const { householdId } = useHousehold();
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!householdId) return;
    (async () => {
      try {
        setIngredients(await getIngredients(householdId));
      } catch (err) {
        console.error('[IngredientSearchPage] load failed:', err);
        setError('Failed to load ingredients. Please try again.');
      } finally {
        setLoading(false);
      }
    })();
  }, [householdId]);

  const filtered = useMemo(
    () =>
      ingredients.filter(
        (i) =>
          i.name.toLowerCase().includes(search.toLowerCase()) ||
          i.brand.toLowerCase().includes(search.toLowerCase()) ||
          i.category.toLowerCase().includes(search.toLowerCase())
      ),
    [ingredients, search]
  );

  const active = ingredients.filter((i) => i.status !== 'discontinued');
  const lowCount = active.filter((i) => i.status === 'low').length;
  const outCount = active.filter((i) => i.status === 'out_of_stock').length;

  const paginated = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="md" sx={{ pt: 2, pb: 2 }}>
      <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1 }}>
        Kitchen Inventory
      </Typography>

      <LowStockToast lowCount={lowCount} outCount={outCount} />

      <Box sx={{ mb: 2 }}>
        <SearchBar value={search} onChange={(v) => { setSearch(v); setPage(0); }} />
      </Box>

      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Brand</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Quantity</TableCell>
              <TableCell>Expires</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginated.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No ingredients found.
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((ingredient) => (
                <ItemRow
                  key={ingredient.id}
                  ingredient={ingredient}
                  onClick={(id) => navigate(`/ingredients/${id}`)}
                />
              ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={filtered.length}
          page={page}
          rowsPerPage={rowsPerPage}
          rowsPerPageOptions={[5, 10, 25]}
          onPageChange={(_, p) => setPage(p)}
          onRowsPerPageChange={(e) => { setRowsPerPage(+e.target.value); setPage(0); }}
        />
      </TableContainer>

      <Fab
        color="primary"
        aria-label="Add ingredient"
        sx={{ position: 'fixed', bottom: 72, right: 16 }}
        onClick={() => navigate('/ingredients/new')}
      >
        <AddIcon />
      </Fab>
    </Container>
  );
}
