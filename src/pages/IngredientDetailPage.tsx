import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ListAltIcon from '@mui/icons-material/ListAlt';
import { getIngredient } from '../services/ingredientService';
import { useHousehold } from '../contexts/HouseholdContext';
import type { Ingredient } from '../types';

export default function IngredientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { householdId } = useHousehold();
  const [ingredient, setIngredient] = useState<Ingredient | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id || !householdId) return;
    (async () => {
      try {
        const data = await getIngredient(householdId, id);
        if (!data) setError('Ingredient not found.');
        else setIngredient(data);
      } catch (err) {
        console.error('[IngredientDetailPage] load failed:', err);
        setError('Failed to load ingredient details.');
      } finally {
        setLoading(false);
      }
    })();
  }, [id, householdId]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  const isExpired = Boolean(
    ingredient?.expirationDate && ingredient.expirationDate.toDate() < new Date()
  );

  return (
    <Container maxWidth="sm" sx={{ pt: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <IconButton onClick={() => navigate('/ingredients')} aria-label="Back to inventory">
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
          {ingredient ? ingredient.name : 'Ingredient'}
        </Typography>
      </Box>

      {error && <Typography color="error">{error}</Typography>}

      {ingredient && (
        <Box>
          {ingredient.brand && (
            <Typography variant="subtitle1" color="text.secondary" align="center" gutterBottom>
              {ingredient.brand}
            </Typography>
          )}

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3, mb: 3 }}>
            <Box>
              <Typography variant="caption" color="text.secondary">Category</Typography>
              <Typography>{ingredient.category || '—'}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Quantity</Typography>
              <Typography>{ingredient.quantity} {ingredient.unit}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Expires</Typography>
              <Typography color={isExpired ? 'error' : undefined}>
                {ingredient.expirationDate
                  ? ingredient.expirationDate.toDate().toLocaleDateString()
                  : '—'}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Status</Typography>
              <Box>
                <Chip label={ingredient.status.replace('_', ' ')} size="small" sx={{ mt: 0.5 }} />
              </Box>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Added By</Typography>
              <Typography>{ingredient.addedByName || '—'}</Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
            <Button
              variant="contained"
              size="small"
              sx={{ width: 200 }}
              onClick={() => navigate(`/ingredients/${id}/edit`)}
            >
              Edit
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<ListAltIcon />}
              sx={{ width: 200, whiteSpace: 'nowrap' }}
              onClick={() => navigate('/ingredients')}
            >
              Back to Inventory
            </Button>
          </Box>
        </Box>
      )}
    </Container>
  );
}
