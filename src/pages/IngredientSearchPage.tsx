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
import SettingsIcon from '@mui/icons-material/Settings';
import ChecklistIcon from '@mui/icons-material/Checklist';
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
import LowStockToast from '../components/ui/LowStockToast';
import ExpiryToast from '../components/ui/ExpiryToast';
import NotificationSettingsDialog from '../components/ui/NotificationSettingsDialog';
import ItemRow from '../components/ui/ItemRow';
import ColumnFilterMenu from '../components/ui/ColumnFilterMenu';
import { subscribeIngredients, deleteIngredients, updateIngredient } from '../services/ingredientService';
import { useHousehold } from '../contexts/HouseholdContext';
import { DEFAULT_EXPIRY_WARNING_DAYS } from '../types';
import type { Ingredient } from '../types';

type ExpiryFilter = 'all' | 'expiring_soon' | 'expired' | 'none';

const STATUS_OPTIONS: Ingredient['status'][] = ['in_stock', 'low', 'out_of_stock', 'discontinued'];

const statusLabel: Record<Ingredient['status'], string> = {
  in_stock: 'In Stock',
  low: 'Low',
  out_of_stock: 'Out',
  discontinued: 'Discontinued',
};

export default function IngredientSearchPage() {
  const navigate = useNavigate();
  const { householdId, household, setExpiryWarningDays } = useHousehold();
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [brandFilter, setBrandFilter] = useState<string[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<Ingredient['status'][]>([]);
  const [minQty, setMinQty] = useState('');
  const [maxQty, setMaxQty] = useState('');
  const [expiryFilter, setExpiryFilter] = useState<ExpiryFilter>('all');
  const [addedByFilter, setAddedByFilter] = useState<string[]>([]);

  useEffect(() => {
    if (!householdId) return;
    const unsubscribe = subscribeIngredients(
      householdId,
      (data) => {
        setIngredients(data);
        setLoading(false);
      },
      () => {
        setError('Failed to load ingredients. Please try again.');
        setLoading(false);
      }
    );
    return unsubscribe;
  }, [householdId]);

  const brands = useMemo(
    () => Array.from(new Set(ingredients.map((i) => i.brand))).sort(),
    [ingredients]
  );
  const categories = useMemo(
    () => Array.from(new Set(ingredients.map((i) => i.category))).sort(),
    [ingredients]
  );
  const addedByNames = useMemo(
    () => Array.from(new Set(ingredients.map((i) => i.addedByName || 'Unknown'))).sort(),
    [ingredients]
  );

  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    const now = new Date();
    const soon = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    return ingredients.filter((i) => {
      if (
        term &&
        !(
          i.name.toLowerCase().includes(term) ||
          i.brand.toLowerCase().includes(term) ||
          i.category.toLowerCase().includes(term)
        )
      )
        return false;
      if (brandFilter.length && !brandFilter.includes(i.brand)) return false;
      if (categoryFilter.length && !categoryFilter.includes(i.category)) return false;
      if (statusFilter.length && !statusFilter.includes(i.status)) return false;
      if (minQty !== '' && i.quantity < Number(minQty)) return false;
      if (maxQty !== '' && i.quantity > Number(maxQty)) return false;
      if (expiryFilter !== 'all') {
        const exp = i.expirationDate ? i.expirationDate.toDate() : null;
        if (expiryFilter === 'none' && exp !== null) return false;
        if (expiryFilter === 'expired' && !(exp && exp < now)) return false;
        if (expiryFilter === 'expiring_soon' && !(exp && exp >= now && exp <= soon)) return false;
      }
      if (addedByFilter.length && !addedByFilter.includes(i.addedByName || 'Unknown')) return false;
      return true;
    });
  }, [
    ingredients,
    search,
    brandFilter,
    categoryFilter,
    statusFilter,
    minQty,
    maxQty,
    expiryFilter,
    addedByFilter,
  ]);

  const active = ingredients.filter((i) => i.status !== 'discontinued');
  const lowCount = active.filter((i) => i.status === 'low').length;
  const outCount = active.filter((i) => i.status === 'out_of_stock').length;

  const warningDays = household?.expiryWarningDays ?? DEFAULT_EXPIRY_WARNING_DAYS;
  const now = new Date();
  const warningCutoff = new Date(now.getTime() + warningDays * 24 * 60 * 60 * 1000);
  const expiredCount = active.filter(
    (i) => i.expirationDate && i.expirationDate.toDate() < now
  ).length;
  const expiringCount = active.filter((i) => {
    if (!i.expirationDate) return false;
    const exp = i.expirationDate.toDate();
    return exp >= now && exp <= warningCutoff;
  }).length;

  const maxPage = Math.max(0, Math.ceil(filtered.length / rowsPerPage) - 1);
  const safePage = Math.min(page, maxPage);
  const paginated = filtered.slice(safePage * rowsPerPage, safePage * rowsPerPage + rowsPerPage);

  const toggleValue = <T,>(list: T[], value: T, checked: boolean) =>
    checked ? [...list, value] : list.filter((v) => v !== value);

  const toggleSelectMode = () => {
    setSelectMode((prev) => !prev);
    setSelectedIds(new Set());
  };

  const toggleSelected = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleQuantityChange = async (id: string, delta: number) => {
    const current = ingredients.find((i) => i.id === id);
    if (!current || !householdId) return;
    const nextQuantity = Math.max(0, current.quantity + delta);
    if (nextQuantity === current.quantity) return;
    try {
      await updateIngredient(householdId, id, { quantity: nextQuantity });
    } catch (err) {
      console.error('[IngredientSearchPage] quantity update failed:', err);
      setError('Failed to update quantity. Please try again.');
    }
  };

  const pageIds = paginated.map((i) => i.id);
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
      await deleteIngredients(householdId, Array.from(selectedIds));
      setIngredients((prev) => prev.filter((i) => !selectedIds.has(i.id)));
      setSelectedIds(new Set());
      setDeleteDialogOpen(false);
      setSelectMode(false);
    } catch (err) {
      console.error('[IngredientSearchPage] deleteIngredients failed:', err);
      setError('Failed to delete selected ingredients. Please try again.');
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
          Kitchen Inventory
        </Typography>
        <Box>
          <IconButton
            aria-label={selectMode ? 'Exit select mode' : 'Select ingredients'}
            color={selectMode ? 'primary' : 'default'}
            onClick={toggleSelectMode}
          >
            <ChecklistIcon />
          </IconButton>
          <IconButton aria-label="Notification settings" onClick={() => setSettingsOpen(true)}>
            <SettingsIcon />
          </IconButton>
        </Box>
      </Box>

      {selectMode && (
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
      )}

      <LowStockToast lowCount={lowCount} outCount={outCount} />
      <ExpiryToast expiredCount={expiredCount} expiringCount={expiringCount} warningDays={warningDays} />

      <NotificationSettingsDialog
        open={settingsOpen}
        initialDays={warningDays}
        onClose={() => setSettingsOpen(false)}
        onSave={setExpiryWarningDays}
      />

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
              {selectMode && (
                <TableCell padding="checkbox">
                  <Checkbox
                    indeterminate={somePageSelected && !allPageSelected}
                    checked={allPageSelected}
                    onChange={toggleSelectAllOnPage}
                  />
                </TableCell>
              )}
              <TableCell>Name</TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  Brand
                  <ColumnFilterMenu active={brandFilter.length > 0} onClear={() => setBrandFilter([])}>
                    <FormGroup>
                      {brands.map((b) => (
                        <FormControlLabel
                          key={b}
                          label={b}
                          control={
                            <Checkbox
                              size="small"
                              checked={brandFilter.includes(b)}
                              onChange={(e) => setBrandFilter((prev) => toggleValue(prev, b, e.target.checked))}
                            />
                          }
                        />
                      ))}
                    </FormGroup>
                  </ColumnFilterMenu>
                </Box>
              </TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  Category
                  <ColumnFilterMenu active={categoryFilter.length > 0} onClear={() => setCategoryFilter([])}>
                    <FormGroup>
                      {categories.map((c) => (
                        <FormControlLabel
                          key={c}
                          label={c}
                          control={
                            <Checkbox
                              size="small"
                              checked={categoryFilter.includes(c)}
                              onChange={(e) => setCategoryFilter((prev) => toggleValue(prev, c, e.target.checked))}
                            />
                          }
                        />
                      ))}
                    </FormGroup>
                  </ColumnFilterMenu>
                </Box>
              </TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  Quantity
                  <ColumnFilterMenu
                    active={minQty !== '' || maxQty !== ''}
                    onClear={() => { setMinQty(''); setMaxQty(''); }}
                  >
                    <TextField
                      label="Min"
                      type="number"
                      size="small"
                      value={minQty}
                      onChange={(e) => setMinQty(e.target.value)}
                    />
                    <TextField
                      label="Max"
                      type="number"
                      size="small"
                      value={maxQty}
                      onChange={(e) => setMaxQty(e.target.value)}
                    />
                  </ColumnFilterMenu>
                </Box>
              </TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  Expires
                  <ColumnFilterMenu active={expiryFilter !== 'all'} onClear={() => setExpiryFilter('all')}>
                    <RadioGroup
                      value={expiryFilter}
                      onChange={(e) => setExpiryFilter(e.target.value as ExpiryFilter)}
                    >
                      <FormControlLabel value="all" control={<Radio size="small" />} label="All" />
                      <FormControlLabel
                        value="expiring_soon"
                        control={<Radio size="small" />}
                        label="Expiring within 7 days"
                      />
                      <FormControlLabel value="expired" control={<Radio size="small" />} label="Expired" />
                      <FormControlLabel
                        value="none"
                        control={<Radio size="small" />}
                        label="No expiration date"
                      />
                    </RadioGroup>
                  </ColumnFilterMenu>
                </Box>
              </TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  Status
                  <ColumnFilterMenu active={statusFilter.length > 0} onClear={() => setStatusFilter([])}>
                    <FormGroup>
                      {STATUS_OPTIONS.map((s) => (
                        <FormControlLabel
                          key={s}
                          label={statusLabel[s]}
                          control={
                            <Checkbox
                              size="small"
                              checked={statusFilter.includes(s)}
                              onChange={(e) => setStatusFilter((prev) => toggleValue(prev, s, e.target.checked))}
                            />
                          }
                        />
                      ))}
                    </FormGroup>
                  </ColumnFilterMenu>
                </Box>
              </TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  Added By
                  <ColumnFilterMenu active={addedByFilter.length > 0} onClear={() => setAddedByFilter([])}>
                    <FormGroup>
                      {addedByNames.map((n) => (
                        <FormControlLabel
                          key={n}
                          label={n}
                          control={
                            <Checkbox
                              size="small"
                              checked={addedByFilter.includes(n)}
                              onChange={(e) => setAddedByFilter((prev) => toggleValue(prev, n, e.target.checked))}
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
                <TableCell colSpan={selectMode ? 8 : 7} align="center">
                  No ingredients found.
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((ingredient) => (
                <ItemRow
                  key={ingredient.id}
                  ingredient={ingredient}
                  onClick={(id) => navigate(`/ingredients/${id}`)}
                  selectable={selectMode}
                  selected={selectedIds.has(ingredient.id)}
                  onToggleSelect={toggleSelected}
                  onQuantityChange={handleQuantityChange}
                />
              ))
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
        aria-label="Add ingredient"
        sx={{ position: 'fixed', bottom: 72, right: 16 }}
        onClick={() => navigate('/ingredients/new')}
      >
        <AddIcon />
      </Fab>

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete {selectedIds.size} ingredient{selectedIds.size === 1 ? '' : 's'}?</DialogTitle>
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
