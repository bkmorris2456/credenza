import { useState, useEffect, type FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { getRecipe, addRecipe, updateRecipe } from '../services/recipeService';
import { getIngredients } from '../services/ingredientService';
import { useHousehold } from '../contexts/HouseholdContext';
import type { Ingredient, Recipe, RecipeIngredient } from '../types';

interface FormState {
  name: string;
  description: string;
  servings: string;
  prepTime: string;
  cookTime: string;
  imageUrl: string;
  ingredients: RecipeIngredient[];
}

const emptyForm: FormState = {
  name: '',
  description: '',
  servings: '1',
  prepTime: '',
  cookTime: '',
  imageUrl: '',
  ingredients: [],
};

export default function RecipeFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { householdId } = useHousehold();

  const [form, setForm] = useState<FormState>(emptyForm);
  const [availableIngredients, setAvailableIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!householdId) return;
    (async () => {
      try {
        const [ingredients, recipe] = await Promise.all([
          getIngredients(householdId),
          isEdit && id ? getRecipe(householdId, id) : Promise.resolve<Recipe | null>(null),
        ]);
        setAvailableIngredients(ingredients);

        if (isEdit) {
          if (!recipe) {
            setError('Recipe not found.');
            return;
          }
          setForm({
            name: recipe.name,
            description: recipe.description,
            servings: String(recipe.servings),
            prepTime: recipe.prepTime != null ? String(recipe.prepTime) : '',
            cookTime: recipe.cookTime != null ? String(recipe.cookTime) : '',
            imageUrl: recipe.imageUrl ?? '',
            ingredients: recipe.ingredients,
          });
        }
      } catch (err) {
        console.error('[RecipeFormPage] load failed:', err);
        setError('Failed to load recipe details.');
      } finally {
        setLoading(false);
      }
    })();
  }, [isEdit, id, householdId]);

  const handleChange = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const addRow = () => {
    setForm((prev) => ({
      ...prev,
      ingredients: [...prev.ingredients, { ingredientId: '', name: '', quantity: 1, unit: '' }],
    }));
  };

  const removeRow = (idx: number) => {
    setForm((prev) => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== idx),
    }));
  };

  const updateRow = (idx: number, patch: Partial<RecipeIngredient>) => {
    setForm((prev) => ({
      ...prev,
      ingredients: prev.ingredients.map((row, i) => (i === idx ? { ...row, ...patch } : row)),
    }));
  };

  const handleIngredientSelect = (idx: number, ingredientId: string) => {
    const selected = availableIngredients.find((i) => i.id === ingredientId);
    updateRow(idx, {
      ingredientId,
      name: selected?.name ?? '',
      unit: selected?.unit ?? '',
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
      ingredients: form.ingredients.filter((ri) => ri.ingredientId),
      ...(form.imageUrl.trim() && { imageUrl: form.imageUrl.trim() }),
      ...(form.prepTime.trim() && { prepTime: Number(form.prepTime) }),
      ...(form.cookTime.trim() && { cookTime: Number(form.cookTime) }),
    };

    try {
      if (isEdit && id) {
        await updateRecipe(householdId, id, payload);
        navigate(`/recipes/${id}`);
      } else {
        const newId = await addRecipe(householdId, payload);
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
          <Box key={idx} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
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
            <TextField
              label="Qty"
              type="number"
              value={row.quantity}
              onChange={(e) => updateRow(idx, { quantity: Number(e.target.value) || 0 })}
              sx={{ flex: 1 }}
            />
            <TextField
              label="Unit"
              value={row.unit}
              onChange={(e) => updateRow(idx, { unit: e.target.value })}
              sx={{ flex: 1 }}
            />
            <IconButton aria-label="Remove ingredient" onClick={() => removeRow(idx)}>
              <DeleteIcon />
            </IconButton>
          </Box>
        ))}

        <Button startIcon={<AddIcon />} onClick={addRow} sx={{ alignSelf: 'flex-start' }}>
          Add Ingredient
        </Button>

        {error && <Typography color="error">{error}</Typography>}

        <Button type="submit" variant="contained" disabled={submitting}>
          {submitting ? <CircularProgress size={24} /> : 'Save'}
        </Button>
      </Box>
    </Container>
  );
}
