import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { getRecipe } from '../services/recipeService';
import type { Recipe } from '../types';

export default function RecipeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const data = await getRecipe(id);
        if (!data) setError('Recipe not found.');
        else setRecipe(data);
      } catch (err) {
        console.error('[RecipeDetailPage] load failed:', err);
        setError('Failed to load recipe details.');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

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
            {recipe.ingredients.map((ri, idx) => (
              <ListItem key={idx} disableGutters>
                <ListItemText
                  primary={ri.name}
                  secondary={`${ri.quantity} ${ri.unit}`}
                />
              </ListItem>
            ))}
          </List>

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
