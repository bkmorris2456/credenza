import { useState, type FormEvent } from 'react';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Link from '@mui/material/Link';
import Divider from '@mui/material/Divider';
import CircularProgress from '@mui/material/CircularProgress';
import { signIn, register, signInAsGuest } from '../services/authService';

export default function LoginPage() {
  const [mode, setMode] = useState<'signIn' | 'register'>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [guestSubmitting, setGuestSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      if (mode === 'signIn') {
        await signIn(email, password);
      } else {
        await register(email, password);
      }
    } catch (err) {
      console.error('[LoginPage] auth failed:', err);
      setError(
        mode === 'signIn'
          ? 'Could not sign in. Check your email and password and try again.'
          : 'Could not create an account. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleGuest = async () => {
    setGuestSubmitting(true);
    setError(null);
    try {
      await signInAsGuest();
    } catch (err) {
      console.error('[LoginPage] guest sign-in failed:', err);
      setError('Could not continue as a guest. Please try again.');
    } finally {
      setGuestSubmitting(false);
    }
  };

  return (
    <Container maxWidth="xs" sx={{ pt: 10 }}>
      <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3 }} align="center">
        Credenza
      </Typography>

      <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <TextField
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          fullWidth
        />
        <TextField
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          fullWidth
        />

        {error && <Typography color="error">{error}</Typography>}

        <Button type="submit" variant="contained" disabled={submitting}>
          {submitting ? (
            <CircularProgress size={24} />
          ) : mode === 'signIn' ? (
            'Sign In'
          ) : (
            'Create Account'
          )}
        </Button>

        <Typography align="center" variant="body2">
          {mode === 'signIn' ? "Don't have an account? " : 'Already have an account? '}
          <Link
            component="button"
            type="button"
            onClick={() => {
              setMode(mode === 'signIn' ? 'register' : 'signIn');
              setError(null);
            }}
          >
            {mode === 'signIn' ? 'Create one' : 'Sign in'}
          </Link>
        </Typography>

        <Divider sx={{ my: 1 }}>or</Divider>

        <Button
          variant="outlined"
          disabled={submitting || guestSubmitting}
          onClick={handleGuest}
        >
          {guestSubmitting ? <CircularProgress size={24} /> : 'Continue as Guest'}
        </Button>
        <Typography align="center" variant="caption" color="text.secondary">
          Guest data stays on this device only — it can't be recovered if you clear
          your browser data or switch devices.
        </Typography>
      </Box>
    </Container>
  );
}
