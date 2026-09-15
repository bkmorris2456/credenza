import { useLocation, useNavigate } from 'react-router-dom';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import Paper from '@mui/material/Paper';
import KitchenIcon from '@mui/icons-material/Kitchen';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import GroupsIcon from '@mui/icons-material/Groups';

const routes = ['/ingredients', '/recipes', '/households'];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  const current = routes.indexOf(location.pathname);

  return (
    <Paper
      sx={{
        position: 'fixed',
        bottom: 'max(12px, env(safe-area-inset-bottom))',
        left: { xs: 12, sm: 'calc(50% - 300px)' },
        right: { xs: 12, sm: 'calc(50% - 300px)' },
        borderRadius: 3,
        overflow: 'hidden',
      }}
      elevation={3}
    >
      <BottomNavigation
        value={current}
        onChange={(_, idx) => navigate(routes[idx])}
        showLabels
      >
        <BottomNavigationAction label="Ingredients" icon={<KitchenIcon />} />
        <BottomNavigationAction label="Recipes" icon={<MenuBookIcon />} />
        <BottomNavigationAction label="Households" icon={<GroupsIcon />} />
      </BottomNavigation>
    </Paper>
  );
}
