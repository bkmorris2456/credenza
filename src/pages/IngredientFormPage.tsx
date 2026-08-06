import { useState, useEffect, useMemo, type FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Timestamp } from 'firebase/firestore';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import {
  getIngredient,
  addIngredient,
  updateIngredient,
} from '../services/ingredientService';
import { getCategories, addCategory, getUnits, addUnit } from '../services/lookupService';
import { shortDisplayName } from '../services/authService';
import { loadDraft, saveDraft, clearDraft } from '../services/draftStorage';
import SelectWithAdd from '../components/ui/SelectWithAdd';
import { useAuth } from '../contexts/AuthContext';
import { useHousehold } from '../contexts/HouseholdContext';
import type { Ingredient, IngredientStatus, Category, Unit } from '../types';

const statusOptions: { value: IngredientStatus; label: string }[] = [
  { value: 'in_stock', label: 'In Stock' },
  { value: 'low', label: 'Low' },
  { value: 'out_of_stock', label: 'Out of Stock' },
  { value: 'discontinued', label: 'Discontinued' },
];

interface FormState {
  name: string;
  brand: string;
  category: string;
  unit: string;
  quantity: string;
  status: IngredientStatus;
  /** yyyy-mm-dd, matching <input type="date">. Empty string means unset. */
  expirationDate: string;
}

const emptyForm: FormState = {
  name: '',
  brand: '',
  category: '',
  unit: '',
  quantity: '0',
  status: 'in_stock',
  expirationDate: '',
};

export default function IngredientFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { householdId } = useHousehold();
  const draftKey = isEdit && id ? `credenza:ingredient-draft:${id}` : 'credenza:ingredient-draft:new';

  const [form, setForm] = useState<FormState>(() =>
    isEdit ? emptyForm : (loadDraft<FormState>(draftKey) ?? emptyForm)
  );
  const [categories, setCategories] = useState<Category[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Carried through to the save payload but not user-editable: set once at
  // creation from the signed-in user, preserved as-is on every later edit
  // (the edit-load effect below overwrites this with the original creator).
  const [addedBy, setAddedBy] = useState(() =>
    user ? { userId: user.uid, name: shortDisplayName(user) } : { userId: '', name: '' }
  );

  useEffect(() => {
    if (!householdId) return;
    (async () => {
      try {
        const [cats, us] = await Promise.all([getCategories(householdId), getUnits(householdId)]);
        setCategories(cats);
        setUnits(us);
      } catch (err) {
        console.error('[IngredientFormPage] load lookups failed:', err);
      }
    })();
  }, [householdId]);

  useEffect(() => {
    if (!isEdit || !id || !householdId) return;
    (async () => {
      try {
        const data = await getIngredient(householdId, id);
        if (!data) {
          setError('Ingredient not found.');
          return;
        }
        const baseline: FormState = {
          name: data.name,
          brand: data.brand,
          category: data.category,
          unit: data.unit,
          quantity: String(data.quantity),
          status: data.status,
          expirationDate: data.expirationDate
            ? data.expirationDate.toDate().toISOString().slice(0, 10)
            : '',
        };
        setForm(loadDraft<FormState>(draftKey) ?? baseline);
        setAddedBy({ userId: data.addedByUserId ?? '', name: data.addedByName ?? 'Unknown' });
      } catch (err) {
        console.error('[IngredientFormPage] load failed:', err);
        setError('Failed to load ingredient details.');
      } finally {
        setLoading(false);
      }
    })();
  }, [isEdit, id, householdId, draftKey]);

  // Persist in-progress form input so a refresh doesn't lose it. Skipped
  // while the edit-mode fetch is still in flight to avoid clobbering the
  // saved draft with the transient empty/pre-fetch form state.
  useEffect(() => {
    if (loading) return;
    saveDraft(draftKey, form);
  }, [form, draftKey, loading]);

  const handleChange = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  // Include the current value even if it predates the lookup collection (freeform legacy data).
  const categoryOptions = useMemo(() => {
    const names = categories.map((c) => c.name);
    return form.category && !names.includes(form.category) ? [form.category, ...names] : names;
  }, [categories, form.category]);

  const unitOptions = useMemo(() => {
    const names = units.map((u) => u.name);
    return form.unit && !names.includes(form.unit) ? [form.unit, ...names] : names;
  }, [units, form.unit]);

  const handleCreateCategory = async (name: string) => {
    if (!householdId) return;
    const created = await addCategory(householdId, name);
    setCategories((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
    handleChange('category', created.name);
  };

  const handleCreateUnit = async (name: string) => {
    if (!householdId) return;
    const created = await addUnit(householdId, name);
    setUnits((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
    handleChange('unit', created.name);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!householdId) return;

    setSubmitting(true);
    setError(null);

    const payload: Omit<Ingredient, 'id' | 'createdAt' | 'updatedAt'> = {
      name: form.name.trim(),
      brand: form.brand.trim(),
      category: form.category.trim(),
      unit: form.unit.trim(),
      quantity: Number(form.quantity) || 0,
      status: form.status,
      expirationDate: form.expirationDate
        ? Timestamp.fromDate(new Date(`${form.expirationDate}T00:00:00`))
        : null,
      addedByUserId: addedBy.userId,
      addedByName: addedBy.name,
    };

    try {
      if (isEdit && id) {
        await updateIngredient(householdId, id, payload);
        clearDraft(draftKey);
        navigate(`/ingredients/${id}`);
      } else {
        const newId = await addIngredient(householdId, payload);
        clearDraft(draftKey);
        navigate(`/ingredients/${newId}`);
      }
    } catch (err) {
      console.error('[IngredientFormPage] save failed:', err);
      setError('Failed to save ingredient. Please try again.');
    } finally {
      setSubmitting(false);
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
    <Container maxWidth="sm" sx={{ pt: 2 }}>
      <IconButton onClick={() => navigate(-1)} sx={{ mb: 1 }}>
        <ArrowBackIcon />
      </IconButton>

      <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>
        {isEdit ? 'Edit Ingredient' : 'Add Ingredient'}
      </Typography>

      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
      >
        <TextField
          label="Name"
          value={form.name}
          onChange={(e) => handleChange('name', e.target.value)}
          required
          fullWidth
        />
        <TextField
          label="Brand"
          value={form.brand}
          onChange={(e) => handleChange('brand', e.target.value)}
          fullWidth
        />
        <SelectWithAdd
          label="Category"
          value={form.category}
          options={categoryOptions}
          onChange={(v) => handleChange('category', v)}
          onCreate={handleCreateCategory}
          fullWidth
        />
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            label="Quantity"
            type="number"
            value={form.quantity}
            onChange={(e) => handleChange('quantity', e.target.value)}
            sx={{ flex: 1 }}
          />
          <SelectWithAdd
            label="Unit"
            value={form.unit}
            options={unitOptions}
            onChange={(v) => handleChange('unit', v)}
            onCreate={handleCreateUnit}
          />
        </Box>
        <TextField
          select
          label="Status"
          value={form.status}
          onChange={(e) => handleChange('status', e.target.value as IngredientStatus)}
          fullWidth
        >
          {statusOptions.map((opt) => (
            <MenuItem key={opt.value} value={opt.value}>
              {opt.label}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          label="Expiration Date"
          type="date"
          value={form.expirationDate}
          onChange={(e) => handleChange('expirationDate', e.target.value)}
          slotProps={{ inputLabel: { shrink: true } }}
          fullWidth
        />

        {error && <Typography color="error">{error}</Typography>}

        <Button type="submit" variant="contained" disabled={submitting}>
          {submitting ? <CircularProgress size={24} /> : 'Save'}
        </Button>
      </Box>
    </Container>
  );
}
