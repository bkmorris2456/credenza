import { Outlet } from 'react-router-dom';
import Box from '@mui/material/Box';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import LogoutIcon from '@mui/icons-material/Logout';
import BottomNav from './BottomNav';
import { logOut } from '../../services/authService';

/** Wraps all authenticated pages with a top bar (incl. logout) and the shared bottom navigation. */
export default function AppLayout() {
  const handleLogout = async () => {
    try {
      await logOut();
    } catch (err) {
      console.error('[AppLayout] logOut failed:', err);
    }
  };

  return (
    <Box sx={{ pb: 10 }}>
      <AppBar position="sticky" color="default" elevation={1}>
        <Toolbar variant="dense">
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Credenza
          </Typography>
          <IconButton aria-label="Log out" onClick={handleLogout}>
            <LogoutIcon />
          </IconButton>
        </Toolbar>
      </AppBar>
      <Outlet />
      <BottomNav />
    </Box>
  );
}
