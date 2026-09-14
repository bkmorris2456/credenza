import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { getRecipe } from '../services/recipeService';
import { subscribeIngredients } from '../services/ingredientService';
import { useHousehold } from '../contexts/HouseholdContext';
import type { Ingredient, Recipe } from '../types';

export default function RecipeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { householdId } = useHousehold();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [stock, setStock] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id || !householdId) return;
    let cancelled = false;
    let recipeLoaded = false;
    let stockLoaded = false;
    const checkLoaded = () => {
      if (recipeLoaded && stockLoaded && !cancelled) setLoading(false);
    };

    (async () => {
      try {
        const data = await getRecipe(householdId, id);
        if (cancelled) return;
        if (!data) setError('Recipe not found.');
        else setRecipe(data);
      } catch (err) {
        console.error('[RecipeDetailPage] load failed:', err);
        if (!cancelled) setError('Failed to load recipe details.');
      } finally {
        recipeLoaded = true;
        checkLoaded();
      }
    })();

    const unsubscribe = subscribeIngredients(
      householdId,
      (data: Ingredient[]) => {
        setStock(new Map(data.map((i) => [i.id, i.quantity])));
        stockLoaded = true;
        checkLoaded();
      },
      () => {
        setError('Failed to load recipe details.');
        stockLoaded = true;
        checkLoaded();
      }
    );

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [id, householdId]);

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

      {error && <Typography color="error">{error}</Typography>}

      {recipe && (
        <Box>
          {recipe.imageUrl && (
            <Box
              component="img"
              src={recipe.imageUrl}
              alt={recipe.name}
              sx={{ width: '100%', borderRadius: 2, mb: 2, maxHeight: 240, objectFit: 'cover' }}
            />
          )}

          <Typography variant="h5" sx={{ fontWeight: 'bold' }} gutterBottom>
            {recipe.name}
          </Typography>

          <Typography color="text.secondary" gutterBottom>
            {recipe.description}
          </Typography>

          {recipe.writtenByName && (
            <Typography variant="caption" color="text.secondary">
              Written by {recipe.writtenByName}
            </Typography>
          )}

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1, my: 2 }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary">Servings</Typography>
              <Typography sx={{ fontWeight: 'bold' }}>{recipe.servings}</Typography>
            </Box>
            {recipe.prepTime != null && (
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary">Prep</Typography>
                <Typography sx={{ fontWeight: 'bold' }}>{recipe.prepTime} min</Typography>
              </Box>
            )}
            {recipe.cookTime != null && (
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary">Cook</Typography>
                <Typography sx={{ fontWeight: 'bold' }}>{recipe.cookTime} min</Typography>
              </Box>
            )}
          </Box>

          <Divider sx={{ my: 2 }} />

          <Typography variant="h6" gutterBottom>Ingredients</Typography>
          <List dense>
            {recipe.ingredients.map((ri, idx) => {
              const tracked = Boolean(ri.ingredientId);
              const available = tracked && (stock.get(ri.ingredientId) ?? 0) >= ri.quantity;
              return (
                <ListItem
                  key={idx}
                  disableGutters
                  secondaryAction={
                    <Chip
                      label={!tracked ? 'Not tracked' : available ? 'Available' : 'Missing'}
                      color={!tracked ? 'default' : available ? 'success' : 'error'}
                      size="small"
                    />
                  }
                >
                  <ListItemText
                    primary={ri.name}
                    secondary={`${ri.quantity} ${ri.unit}`}
                  />
                </ListItem>
              );
            })}
          </List>

          {recipe.steps && recipe.steps.length > 0 && (
            <>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>Steps</Typography>
              <Box component="ol" sx={{ pl: 3, m: 0 }}>
                {recipe.steps.map((step, idx) => (
                  <Box component="li" key={idx} sx={{ mb: 1 }}>
                    <ReactMarkdown>{step}</ReactMarkdown>
                  </Box>
                ))}
              </Box>
            </>
          )}

          <Button
            variant="contained"
            sx={{ mt: 2 }}
            onClick={() => navigate(`/recipes/${id}/edit`)}
          >
            Edit
          </Button>
        </Box>
      )}
    </Container>
  );
}
