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
    <Paper sx={{ position: 'fixed', bottom: 0, left: 0, right: 0 }} elevation={3}>
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
