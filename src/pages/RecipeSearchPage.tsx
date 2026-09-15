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
import DeleteIcon from '@mui/icons-material/Delete';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import SearchBar from '../components/ui/SearchBar';
import ColumnFilterMenu from '../components/ui/ColumnFilterMenu';
import { subscribeRecipes, deleteRecipes } from '../services/recipeService';
import { subscribeIngredients } from '../services/ingredientService';
import { useHousehold } from '../contexts/HouseholdContext';
import type { Recipe, Ingredient } from '../types';

type AvailabilityFilter = 'all' | 'ready' | 'missing';

/** Custom (untracked) ingredients have no ingredientId and can't be checked against stock, so they're skipped. */
function canMake(recipe: Recipe, stock: Map<string, number>): boolean {
  return recipe.ingredients
    .filter((ri) => ri.ingredientId)
    .every((ri) => (stock.get(ri.ingredientId) ?? 0) >= ri.quantity);
}

function formatTime(recipe: Recipe): string {
  if (recipe.prepTime == null && recipe.cookTime == null) return '—';
  const parts: string[] = [];
  if (recipe.prepTime != null) parts.push(`${recipe.prepTime}m prep`);
  if (recipe.cookTime != null) parts.push(`${recipe.cookTime}m cook`);
  return parts.join(' / ');
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

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [minServings, setMinServings] = useState('');
  const [maxServings, setMaxServings] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState<AvailabilityFilter>('all');
  const [writtenByFilter, setWrittenByFilter] = useState<string[]>([]);

  useEffect(() => {
    if (!householdId) return;

    let recipesLoaded = false;
    let stockLoaded = false;
    const checkLoaded = () => {
      if (recipesLoaded && stockLoaded) setLoading(false);
    };
    const handleError = () => {
      setError('Failed to load recipes. Please try again.');
    };

    const unsubscribeRecipes = subscribeRecipes(
      householdId,
      (data) => {
        setRecipes(data);
        recipesLoaded = true;
        checkLoaded();
      },
      () => {
        handleError();
        recipesLoaded = true;
        checkLoaded();
      }
    );
    const unsubscribeIngredients = subscribeIngredients(
      householdId,
      (data: Ingredient[]) => {
        setStock(new Map(data.map((i) => [i.id, i.quantity])));
        stockLoaded = true;
        checkLoaded();
      },
      () => {
        handleError();
        stockLoaded = true;
        checkLoaded();
      }
    );

    return () => {
      unsubscribeRecipes();
      unsubscribeIngredients();
    };
  }, [householdId]);

  const sorted = useMemo(() => {
    const available = recipes.filter((r) => canMake(r, stock));
    const unavailable = recipes.filter((r) => !canMake(r, stock));
    return [...available, ...unavailable];
  }, [recipes, stock]);

  const writtenByNames = useMemo(
    () => Array.from(new Set(recipes.map((r) => r.writtenByName || 'Unknown'))).sort(),
    [recipes]
  );

  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    return sorted.filter((r) => {
      if (
        term &&
        !(r.name.toLowerCase().includes(term) || r.description.toLowerCase().includes(term))
      )
        return false;
      if (minServings !== '' && r.servings < Number(minServings)) return false;
      if (maxServings !== '' && r.servings > Number(maxServings)) return false;
      if (availabilityFilter !== 'all') {
        const ready = canMake(r, stock);
        if (availabilityFilter === 'ready' && !ready) return false;
        if (availabilityFilter === 'missing' && ready) return false;
      }
      if (writtenByFilter.length && !writtenByFilter.includes(r.writtenByName || 'Unknown'))
        return false;
      return true;
    });
  }, [sorted, search, minServings, maxServings, availabilityFilter, writtenByFilter, stock]);

  const toggleValue = <T,>(list: T[], value: T, checked: boolean) =>
    checked ? [...list, value] : list.filter((v) => v !== value);

  const maxPage = Math.max(0, Math.ceil(filtered.length / rowsPerPage) - 1);
  const safePage = Math.min(page, maxPage);
  const paginated = filtered.slice(safePage * rowsPerPage, safePage * rowsPerPage + rowsPerPage);

  const toggleSelected = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const pageIds = paginated.map((r) => r.id);
  const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id));
  const somePageSelected = pageIds.some((id) => selectedIds.has(id));

  const toggleSelectAllOnPage = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allPageSelected) {
        pageIds.forEach((id) => next.delete(id));
      } else {
        pageIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const handleDeleteSelected = async () => {
    if (!householdId || selectedIds.size === 0) return;
    setDeleting(true);
    try {
      await deleteRecipes(householdId, Array.from(selectedIds));
      setRecipes((prev) => prev.filter((r) => !selectedIds.has(r.id)));
      setSelectedIds(new Set());
      setDeleteDialogOpen(false);
    } catch (err) {
      console.error('[RecipeSearchPage] deleteRecipes failed:', err);
      setError('Failed to delete selected recipes. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="md" sx={{ pt: 2, pb: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
          Recipes
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="body2" color="text.secondary">
          {selectedIds.size} selected
        </Typography>
        <Button
          variant="outlined"
          color="error"
          size="small"
          startIcon={<DeleteIcon />}
          disabled={selectedIds.size === 0}
          onClick={() => setDeleteDialogOpen(true)}
        >
          Delete
        </Button>
      </Box>

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
              <TableCell padding="checkbox">
                <Checkbox
                  indeterminate={somePageSelected && !allPageSelected}
                  checked={allPageSelected}
                  onChange={toggleSelectAllOnPage}
                />
              </TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Time</TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  Servings
                  <ColumnFilterMenu
                    active={minServings !== '' || maxServings !== ''}
                    onClear={() => { setMinServings(''); setMaxServings(''); }}
                  >
                    <TextField
                      label="Min"
                      type="number"
                      size="small"
                      value={minServings}
                      onChange={(e) => setMinServings(e.target.value)}
                    />
                    <TextField
                      label="Max"
                      type="number"
                      size="small"
                      value={maxServings}
                      onChange={(e) => setMaxServings(e.target.value)}
                    />
                  </ColumnFilterMenu>
                </Box>
              </TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  Available
                  <ColumnFilterMenu
                    active={availabilityFilter !== 'all'}
                    onClear={() => setAvailabilityFilter('all')}
                  >
                    <RadioGroup
                      value={availabilityFilter}
                      onChange={(e) => setAvailabilityFilter(e.target.value as AvailabilityFilter)}
                    >
                      <FormControlLabel value="all" control={<Radio size="small" />} label="All" />
                      <FormControlLabel value="ready" control={<Radio size="small" />} label="Ready" />
                      <FormControlLabel value="missing" control={<Radio size="small" />} label="Missing" />
                    </RadioGroup>
                  </ColumnFilterMenu>
                </Box>
              </TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  Written By
                  <ColumnFilterMenu
                    active={writtenByFilter.length > 0}
                    onClear={() => setWrittenByFilter([])}
                  >
                    <FormGroup>
                      {writtenByNames.map((n) => (
                        <FormControlLabel
                          key={n}
                          label={n}
                          control={
                            <Checkbox
                              size="small"
                              checked={writtenByFilter.includes(n)}
                              onChange={(e) =>
                                setWrittenByFilter((prev) => toggleValue(prev, n, e.target.checked))
                              }
                            />
                          }
                        />
                      ))}
                    </FormGroup>
                  </ColumnFilterMenu>
                </Box>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginated.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
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
                    selected={selectedIds.has(recipe.id)}
                    onClick={() => navigate(`/recipes/${recipe.id}`)}
                    sx={{ cursor: 'pointer' }}
                  >
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedIds.has(recipe.id)}
                        onClick={(e) => e.stopPropagation()}
                        onChange={() => toggleSelected(recipe.id)}
                      />
                    </TableCell>
                    <TableCell>{recipe.name}</TableCell>
                    <TableCell>{formatTime(recipe)}</TableCell>
                    <TableCell>{recipe.servings}</TableCell>
                    <TableCell>
                      <Chip
                        label={available ? 'Ready' : 'Missing'}
                        color={available ? 'success' : 'warning'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{recipe.writtenByName || '—'}</TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={filtered.length}
          page={safePage}
          rowsPerPage={rowsPerPage}
          rowsPerPageOptions={[5, 10, 25]}
          onPageChange={(_, p) => setPage(p)}
          onRowsPerPageChange={(e) => { setRowsPerPage(+e.target.value); setPage(0); }}
        />
      </TableContainer>

      <Fab
        color="primary"
        aria-label="Add recipe"
        sx={{ position: 'fixed', bottom: 92, right: 16 }}
        onClick={() => navigate('/recipes/new')}
      >
        <AddIcon />
      </Fab>

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete {selectedIds.size} recipe{selectedIds.size === 1 ? '' : 's'}?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>
            Cancel
          </Button>
          <Button onClick={handleDeleteSelected} color="error" disabled={deleting}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
