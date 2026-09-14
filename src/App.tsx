import type { ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { HouseholdProvider, useHousehold } from './contexts/HouseholdContext';
import AppLayout from './components/layout/AppLayout';
import LoginPage from './pages/LoginPage';
import IngredientSearchPage from './pages/IngredientSearchPage';
import IngredientDetailPage from './pages/IngredientDetailPage';
import IngredientFormPage from './pages/IngredientFormPage';
import RecipeSearchPage from './pages/RecipeSearchPage';
import RecipeDetailPage from './pages/RecipeDetailPage';
import RecipeFormPage from './pages/RecipeFormPage';
import HouseholdsPage from './pages/HouseholdsPage';

const theme = createTheme({
  colorSchemes: { dark: true },
  typography: { fontFamily: 'Inter, system-ui, sans-serif' },
});

function CenteredSpinner() {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
      <CircularProgress />
    </Box>
  );
}

/** Gates the app behind Firebase Auth, then resolves the active household. */
function AuthGate({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();

  if (authLoading) return <CenteredSpinner />;
  if (!user) return <LoginPage />;

  return <HouseholdProvider>{children}</HouseholdProvider>;
}

function HouseholdGate({ children }: { children: ReactNode }) {
  const { loading, error } = useHousehold();

  if (loading) return <CenteredSpinner />;
  if (error) {
    return (
      <Box sx={{ mt: 8, textAlign: 'center' }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <AuthGate>
          <HouseholdGate>
            <BrowserRouter>
              <Routes>
                <Route element={<AppLayout />}>
                  <Route index element={<Navigate to="/ingredients" replace />} />
                  <Route path="/ingredients" element={<IngredientSearchPage />} />
                  <Route path="/ingredients/new" element={<IngredientFormPage />} />
                  <Route path="/ingredients/:id/edit" element={<IngredientFormPage />} />
                  <Route path="/ingredients/:id" element={<IngredientDetailPage />} />
                  <Route path="/recipes" element={<RecipeSearchPage />} />
                  <Route path="/recipes/new" element={<RecipeFormPage />} />
                  <Route path="/recipes/:id/edit" element={<RecipeFormPage />} />
                  <Route path="/recipes/:id" element={<RecipeDetailPage />} />
                  <Route path="/households" element={<HouseholdsPage />} />
                </Route>
              </Routes>
            </BrowserRouter>
          </HouseholdGate>
        </AuthGate>
      </AuthProvider>
    </ThemeProvider>
  );
}
