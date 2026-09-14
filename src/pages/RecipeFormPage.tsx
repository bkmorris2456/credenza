import { useState, useEffect, type FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import ToggleButton from '@mui/material/ToggleButton';
import Paper from '@mui/material/Paper';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import { getRecipe, addRecipe, updateRecipe } from '../services/recipeService';
import { subscribeIngredients } from '../services/ingredientService';
import { shortDisplayName } from '../services/authService';
import { loadDraft, saveDraft, clearDraft } from '../services/draftStorage';
import { useAuth } from '../contexts/AuthContext';
import { useHousehold } from '../contexts/HouseholdContext';
import type { Ingredient, Recipe, RecipeIngredient } from '../types';

/** A recipe-ingredient row plus a UI-only flag for which entry mode is shown. */
interface IngredientRow extends RecipeIngredient {
  custom: boolean;
}

interface FormState {
  name: string;
  description: string;
  servings: string;
  prepTime: string;
  cookTime: string;
  imageUrl: string;
  ingredients: IngredientRow[];
  steps: string[];
}

const emptyForm: FormState = {
  name: '',
  description: '',
  servings: '1',
  prepTime: '',
  cookTime: '',
  imageUrl: '',
  ingredients: [],
  steps: [],
};

export default function RecipeFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { householdId } = useHousehold();
  const draftKey = isEdit && id ? `credenza:recipe-draft:${id}` : 'credenza:recipe-draft:new';

  const [form, setForm] = useState<FormState>(() =>
    isEdit ? emptyForm : (loadDraft<FormState>(draftKey) ?? emptyForm)
  );
  const [availableIngredients, setAvailableIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewSteps, setPreviewSteps] = useState(false);
  // Carried through to the save payload but not user-editable: set once at
  // creation from the signed-in user, preserved as-is on every later edit.
  const [writtenBy, setWrittenBy] = useState(() =>
    user ? { userId: user.uid, name: shortDisplayName(user) } : { userId: '', name: '' }
  );

  useEffect(() => {
    if (!householdId) return;
    return subscribeIngredients(
      householdId,
      (data) => setAvailableIngredients(data),
      (err) => console.error('[RecipeFormPage] load ingredients failed:', err)
    );
  }, [householdId]);

  useEffect(() => {
    if (!householdId) return;
    (async () => {
      try {
        const recipe = isEdit && id ? await getRecipe(householdId, id) : null;

        if (isEdit) {
          if (!recipe) {
            setError('Recipe not found.');
            return;
          }
          const baseline: FormState = {
            name: recipe.name,
            description: recipe.description,
            servings: String(recipe.servings),
            prepTime: recipe.prepTime != null ? String(recipe.prepTime) : '',
            cookTime: recipe.cookTime != null ? String(recipe.cookTime) : '',
            imageUrl: recipe.imageUrl ?? '',
            ingredients: recipe.ingredients.map((ri) => ({ ...ri, custom: !ri.ingredientId })),
            steps: recipe.steps ?? [],
          };
          setForm(loadDraft<FormState>(draftKey) ?? baseline);
          setWrittenBy({
            userId: recipe.writtenByUserId ?? '',
            name: recipe.writtenByName ?? 'Unknown',
          });
        }
      } catch (err) {
        console.error('[RecipeFormPage] load failed:', err);
        setError('Failed to load recipe details.');
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

  const addRow = () => {
    setForm((prev) => ({
      ...prev,
      ingredients: [
        ...prev.ingredients,
        { ingredientId: '', name: '', quantity: 1, unit: '', custom: false },
      ],
    }));
  };

  const removeRow = (idx: number) => {
    setForm((prev) => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== idx),
    }));
  };

  const updateRow = (idx: number, patch: Partial<IngredientRow>) => {
    setForm((prev) => ({
      ...prev,
      ingredients: prev.ingredients.map((row, i) => (i === idx ? { ...row, ...patch } : row)),
    }));
  };

  const handleIngredientSourceChange = (idx: number, custom: boolean) => {
    updateRow(idx, { custom, ingredientId: '', name: '', unit: '' });
  };

  const handleIngredientSelect = (idx: number, ingredientId: string) => {
    const selected = availableIngredients.find((i) => i.id === ingredientId);
    updateRow(idx, {
      ingredientId,
      name: selected?.name ?? '',
      unit: selected?.unit ?? '',
    });
  };

  const addStep = () => {
    setForm((prev) => ({ ...prev, steps: [...prev.steps, ''] }));
  };

  const removeStep = (idx: number) => {
    setForm((prev) => ({ ...prev, steps: prev.steps.filter((_, i) => i !== idx) }));
  };

  const updateStep = (idx: number, value: string) => {
    setForm((prev) => ({
      ...prev,
      steps: prev.steps.map((s, i) => (i === idx ? value : s)),
    }));
  };

  const moveStep = (idx: number, direction: -1 | 1) => {
    setForm((prev) => {
      const target = idx + direction;
      if (target < 0 || target >= prev.steps.length) return prev;
      const steps = [...prev.steps];
      [steps[idx], steps[target]] = [steps[target], steps[idx]];
      return { ...prev, steps };
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!householdId) return;

    setSubmitting(true);
    setError(null);

    const payload: Omit<Recipe, 'id' | 'createdAt'> = {
      name: form.name.trim(),
      description: form.description.trim(),
      servings: Number(form.servings) || 1,
      ingredients: form.ingredients
        .filter((ri) => ri.ingredientId || ri.name.trim())
        .map((ri) => ({
          ingredientId: ri.ingredientId,
          name: ri.name.trim(),
          quantity: ri.quantity,
          unit: ri.unit,
        })),
      steps: form.steps.map((s) => s.trim()).filter(Boolean),
      writtenByUserId: writtenBy.userId,
      writtenByName: writtenBy.name,
      ...(form.imageUrl.trim() && { imageUrl: form.imageUrl.trim() }),
      ...(form.prepTime.trim() && { prepTime: Number(form.prepTime) }),
      ...(form.cookTime.trim() && { cookTime: Number(form.cookTime) }),
    };

    try {
      if (isEdit && id) {
        await updateRecipe(householdId, id, payload);
        clearDraft(draftKey);
        navigate(`/recipes/${id}`);
      } else {
        const newId = await addRecipe(householdId, payload);
        clearDraft(draftKey);
        navigate(`/recipes/${newId}`);
      }
    } catch (err) {
      console.error('[RecipeFormPage] save failed:', err);
      setError('Failed to save recipe. Please try again.');
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
    <Container maxWidth="sm" sx={{ pt: 2, pb: 4 }}>
      <IconButton onClick={() => navigate(-1)} sx={{ mb: 1 }}>
        <ArrowBackIcon />
      </IconButton>

      <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>
        {isEdit ? 'Edit Recipe' : 'Add Recipe'}
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
          label="Description"
          value={form.description}
          onChange={(e) => handleChange('description', e.target.value)}
          multiline
          minRows={2}
          fullWidth
        />
        <TextField
          label="Image URL"
          value={form.imageUrl}
          onChange={(e) => handleChange('imageUrl', e.target.value)}
          fullWidth
        />
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            label="Servings"
            type="number"
            value={form.servings}
            onChange={(e) => handleChange('servings', e.target.value)}
            fullWidth
          />
          <TextField
            label="Prep (min)"
            type="number"
            value={form.prepTime}
            onChange={(e) => handleChange('prepTime', e.target.value)}
            fullWidth
          />
          <TextField
            label="Cook (min)"
            type="number"
            value={form.cookTime}
            onChange={(e) => handleChange('cookTime', e.target.value)}
            fullWidth
          />
        </Box>

        <Divider sx={{ my: 1 }} />

        <Typography variant="h6">Ingredients</Typography>

        {form.ingredients.map((row, idx) => (
          <Paper key={idx} variant="outlined" sx={{ p: 1.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ToggleButtonGroup
                size="small"
                exclusive
                value={row.custom ? 'custom' : 'existing'}
                onChange={(_, value) => value && handleIngredientSourceChange(idx, value === 'custom')}
              >
                <ToggleButton value="existing">Existing</ToggleButton>
                <ToggleButton value="custom">Custom</ToggleButton>
              </ToggleButtonGroup>
              <IconButton
                aria-label="Remove ingredient"
                onClick={() => removeRow(idx)}
                sx={{ ml: 'auto' }}
              >
                <DeleteIcon />
              </IconButton>
            </Box>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              {row.custom ? (
                <TextField
                  label="Ingredient name"
                  value={row.name}
                  onChange={(e) => updateRow(idx, { name: e.target.value })}
                  sx={{ flex: 2 }}
                />
              ) : (
                <TextField
                  select
                  label="Ingredient"
                  value={row.ingredientId}
                  onChange={(e) => handleIngredientSelect(idx, e.target.value)}
                  sx={{ flex: 2 }}
                >
                  {availableIngredients.map((ing) => (
                    <MenuItem key={ing.id} value={ing.id}>
                      {ing.name}
                    </MenuItem>
                  ))}
                </TextField>
              )}
              <TextField
                label="Qty"
                type="number"
                value={row.quantity}
                onChange={(e) => updateRow(idx, { quantity: Number(e.target.value) || 0 })}
                onFocus={(e) => e.target.select()}
                sx={{ flex: 1 }}
              />
              <TextField
                label="Unit"
                value={row.unit}
                onChange={(e) => updateRow(idx, { unit: e.target.value })}
                sx={{ flex: 1 }}
              />
            </Box>
          </Paper>
        ))}

        <Button startIcon={<AddIcon />} onClick={addRow} sx={{ alignSelf: 'flex-start' }}>
          Add Ingredient
        </Button>

        <Divider sx={{ my: 1 }} />

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">Steps</Typography>
          <Button size="small" onClick={() => setPreviewSteps((p) => !p)} disabled={form.steps.length === 0}>
            {previewSteps ? 'Edit' : 'Preview'}
          </Button>
        </Box>

        {previewSteps ? (
          <Box component="ol" sx={{ pl: 3, m: 0 }}>
            {form.steps.map((step, idx) => (
              <Box component="li" key={idx} sx={{ mb: 1 }}>
                <ReactMarkdown>{step || '*(empty step)*'}</ReactMarkdown>
              </Box>
            ))}
          </Box>
        ) : (
          form.steps.map((step, idx) => (
            <Box key={idx} sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
              <Typography sx={{ pt: 2, minWidth: 24 }}>{idx + 1}.</Typography>
              <TextField
                label={`Step ${idx + 1}`}
                value={step}
                onChange={(e) => updateStep(idx, e.target.value)}
                multiline
                minRows={2}
                fullWidth
              />
              <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                <IconButton
                  aria-label="Move step up"
                  size="small"
                  onClick={() => moveStep(idx, -1)}
                  disabled={idx === 0}
                >
                  <ArrowUpwardIcon fontSize="small" />
                </IconButton>
                <IconButton
                  aria-label="Move step down"
                  size="small"
                  onClick={() => moveStep(idx, 1)}
                  disabled={idx === form.steps.length - 1}
                >
                  <ArrowDownwardIcon fontSize="small" />
                </IconButton>
              </Box>
              <IconButton aria-label="Remove step" onClick={() => removeStep(idx)}>
                <DeleteIcon />
              </IconButton>
            </Box>
          ))
        )}

        {!previewSteps && (
          <Button startIcon={<AddIcon />} onClick={addStep} sx={{ alignSelf: 'flex-start' }}>
            Add Step
          </Button>
        )}

        {error && <Typography color="error">{error}</Typography>}

        <Button type="submit" variant="contained" disabled={submitting}>
          {submitting ? <CircularProgress size={24} /> : 'Save'}
        </Button>
      </Box>
    </Container>
  );
}
