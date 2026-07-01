import Box from '@mui/material/Box';
import { Outlet } from 'react-router-dom';
import BottomNav from './BottomNav';

/** Wraps all authenticated pages with the shared bottom navigation. */
export default function AppLayout() {
  return (
    <Box sx={{ pb: 7 }}>
      <Outlet />
      <BottomNav />
    </Box>
  );
}
