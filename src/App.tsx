import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import AppLayout from './components/layout/AppLayout';
import IngredientSearchPage from './pages/IngredientSearchPage';
import IngredientDetailPage from './pages/IngredientDetailPage';
import RecipeSearchPage from './pages/RecipeSearchPage';
import RecipeDetailPage from './pages/RecipeDetailPage';

const theme = createTheme({
  colorSchemes: { dark: true },
  typography: { fontFamily: 'Inter, system-ui, sans-serif' },
});

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<Navigate to="/ingredients" replace />} />
            <Route path="/ingredients" element={<IngredientSearchPage />} />
            <Route path="/ingredients/:id" element={<IngredientDetailPage />} />
            <Route path="/recipes" element={<RecipeSearchPage />} />
            <Route path="/recipes/:id" element={<RecipeDetailPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}
