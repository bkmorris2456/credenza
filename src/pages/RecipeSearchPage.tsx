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
import Chip from '@mui/material/Chip';
import AddIcon from '@mui/icons-material/Add';
import CircularProgress from '@mui/material/CircularProgress';
import SearchBar from '../components/ui/SearchBar';
import { getRecipes } from '../services/recipeService';
import { getIngredients } from '../services/ingredientService';
import { useHousehold } from '../contexts/HouseholdContext';
import type { Recipe, Ingredient } from '../types';

function canMake(recipe: Recipe, stock: Map<string, number>): boolean {
  return recipe.ingredients.every(
    (ri) => (stock.get(ri.ingredientId) ?? 0) >= ri.quantity
  );
}

export default function RecipeSearchPage() {
  const navigate = useNavigate();
  const { householdId } = useHousehold();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [stock, setStock] = useState<Map<string, number>>(new Map());
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!householdId) return;
    (async () => {
      try {
        const [fetchedRecipes, ingredients] = await Promise.all([
          getRecipes(householdId),
          getIngredients(householdId),
        ]);
        setRecipes(fetchedRecipes);
        setStock(
          new Map((ingredients as Ingredient[]).map((i) => [i.id, i.quantity]))
        );
      } catch (err) {
        console.error('[RecipeSearchPage] load failed:', err);
        setError('Failed to load recipes. Please try again.');
      } finally {
        setLoading(false);
      }
    })();
  }, [householdId]);

  const sorted = useMemo(() => {
    const available = recipes.filter((r) => canMake(r, stock));
    const unavailable = recipes.filter((r) => !canMake(r, stock));
    return [...available, ...unavailable];
  }, [recipes, stock]);

  const filtered = useMemo(
    () =>
      sorted.filter(
        (r) =>
          r.name.toLowerCase().includes(search.toLowerCase()) ||
          r.description.toLowerCase().includes(search.toLowerCase())
      ),
    [sorted, search]
  );

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
        Recipes
      </Typography>

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
              <TableCell>Description</TableCell>
              <TableCell>Servings</TableCell>
              <TableCell>Available</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginated.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  No recipes found.
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((recipe) => {
                const available = canMake(recipe, stock);
                return (
                  <TableRow
                    key={recipe.id}
                    hover
                    onClick={() => navigate(`/recipes/${recipe.id}`)}
                    sx={{ cursor: 'pointer' }}
                  >
                    <TableCell>{recipe.name}</TableCell>
                    <TableCell>{recipe.description}</TableCell>
                    <TableCell>{recipe.servings}</TableCell>
                    <TableCell>
                      <Chip
                        label={available ? 'Ready' : 'Missing'}
                        color={available ? 'success' : 'warning'}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                );
              })
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
        aria-label="Add recipe"
        sx={{ position: 'fixed', bottom: 72, right: 16 }}
        onClick={() => navigate('/recipes/new')}
      >
        <AddIcon />
      </Fab>
    </Container>
  );
}
