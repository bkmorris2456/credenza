import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import RadioGroup from '@mui/material/RadioGroup';
import Radio from '@mui/material/Radio';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import IconButton from '@mui/material/IconButton';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import { useAuth } from '../contexts/AuthContext';
import { useHousehold } from '../contexts/HouseholdContext';
import {
  listUserHouseholds,
  createHousehold,
  joinHouseholdByCode,
  getHousehold,
} from '../services/householdService';
import { shortDisplayName } from '../services/authService';
import type { UserHouseholdMembership } from '../types';

/** A join code, large and easy to read off a phone screen, with a copy button. */
function JoinCodeDisplay({ code }: { code: string }) {
  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
      <Typography variant="h4" sx={{ letterSpacing: 2 }}>
        {code}
      </Typography>
      <IconButton aria-label="Copy join code" onClick={() => navigator.clipboard?.writeText(code)}>
        <ContentCopyIcon />
      </IconButton>
    </Stack>
  );
}

export default function HouseholdsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { householdId, switchHousehold } = useHousehold();

  const [memberships, setMemberships] = useState<UserHouseholdMembership[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [switchingId, setSwitchingId] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [createName, setCreateName] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [newJoinCode, setNewJoinCode] = useState<string | null>(null);

  const [joinOpen, setJoinOpen] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [migrateChoice, setMigrateChoice] = useState<'yes' | 'no'>('no');
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  const [codeDialogOpen, setCodeDialogOpen] = useState(false);
  const [codeDialogLoading, setCodeDialogLoading] = useState(false);
  const [codeDialogError, setCodeDialogError] = useState<string | null>(null);
  const [viewedCode, setViewedCode] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        setMemberships(await listUserHouseholds(user.uid));
      } catch (err) {
        console.error('[HouseholdsPage] listUserHouseholds failed:', err);
        setError('Failed to load your households. Please try again.');
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const handleSwitch = async (id: string) => {
    if (id === householdId) return;
    setSwitchingId(id);
    try {
      await switchHousehold(id);
      navigate('/ingredients');
    } catch (err) {
      console.error('[HouseholdsPage] switchHousehold failed:', err);
      setError('Failed to switch households. Please try again.');
    } finally {
      setSwitchingId(null);
    }
  };

  const handleViewCode = async (id: string) => {
    setCodeDialogOpen(true);
    setCodeDialogLoading(true);
    setCodeDialogError(null);
    setViewedCode(null);
    try {
      const household = await getHousehold(id);
      setViewedCode(household?.joinCode ?? null);
    } catch (err) {
      console.error('[HouseholdsPage] getHousehold failed:', err);
      setCodeDialogError('Failed to load join code. Please try again.');
    } finally {
      setCodeDialogLoading(false);
    }
  };

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!user || !createName.trim()) return;
    setCreating(true);
    setCreateError(null);
    try {
      const { householdId: newId, joinCode: code } = await createHousehold(
        user.uid,
        createName.trim(),
        shortDisplayName(user),
        user.email ?? ''
      );
      await switchHousehold(newId);
      setMemberships(await listUserHouseholds(user.uid));
      setNewJoinCode(code);
    } catch (err) {
      console.error('[HouseholdsPage] createHousehold failed:', err);
      setCreateError('Failed to create household. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const handleJoin = async (e: FormEvent) => {
    e.preventDefault();
    if (!user || joinCode.trim().length !== 8) return;
    setJoining(true);
    setJoinError(null);
    try {
      const joinedHouseholdId = await joinHouseholdByCode(
        user.uid,
        joinCode.trim(),
        shortDisplayName(user),
        user.email ?? '',
        householdId,
        migrateChoice === 'yes'
      );
      await switchHousehold(joinedHouseholdId);
      setMemberships(await listUserHouseholds(user.uid));
      setJoinOpen(false);
      setJoinCode('');
      setMigrateChoice('no');
      navigate('/ingredients');
    } catch (err) {
      console.error('[HouseholdsPage] joinHouseholdByCode failed:', err);
      setJoinError(
        err instanceof Error && err.message === 'Invalid join code.'
          ? 'Invalid join code. Double-check and try again.'
          : 'Failed to join household. Please try again.'
      );
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ pt: 2, pb: 4 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>
        Households
      </Typography>

      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      <List>
        {memberships.map((m) => (
          <ListItem
            key={m.id}
            divider
            secondaryAction={
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                <IconButton
                  size="small"
                  aria-label={`View join code for ${m.name}`}
                  onClick={() => handleViewCode(m.id)}
                >
                  <VpnKeyIcon fontSize="small" />
                </IconButton>
                {m.id === householdId ? (
                  <Chip label="Active" color="primary" size="small" />
                ) : (
                  <Button
                    size="small"
                    disabled={switchingId === m.id}
                    onClick={() => handleSwitch(m.id)}
                  >
                    Switch
                  </Button>
                )}
              </Stack>
            }
          >
            <ListItemText primary={m.name} />
          </ListItem>
        ))}
      </List>

      <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
        <Button variant="contained" onClick={() => setCreateOpen(true)}>
          Create Household
        </Button>
        <Button variant="outlined" onClick={() => setJoinOpen(true)}>
          Join Household
        </Button>
      </Stack>

      {/* Create household */}
      <Dialog open={createOpen} onClose={() => (creating ? null : setCreateOpen(false))}>
        <DialogTitle>Create Household</DialogTitle>
        <Box component="form" onSubmit={handleCreate}>
          <DialogContent>
            <TextField
              autoFocus
              fullWidth
              label="Household name"
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              disabled={creating}
            />
            {createError && (
              <Typography color="error" sx={{ mt: 1 }}>
                {createError}
              </Typography>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCreateOpen(false)} disabled={creating}>
              Cancel
            </Button>
            <Button type="submit" disabled={creating || !createName.trim()}>
              Create
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* Join code reveal, shown right after a successful create */}
      <Dialog
        open={newJoinCode !== null}
        onClose={() => {
          setNewJoinCode(null);
          setCreateOpen(false);
          setCreateName('');
          navigate('/ingredients');
        }}
      >
        <DialogTitle>Household created</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 1 }}>
            Share this code with others so they can join:
          </DialogContentText>
          {newJoinCode && <JoinCodeDisplay code={newJoinCode} />}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setNewJoinCode(null);
              setCreateOpen(false);
              setCreateName('');
              navigate('/ingredients');
            }}
          >
            Done
          </Button>
        </DialogActions>
      </Dialog>

      {/* View an existing household's join code */}
      <Dialog open={codeDialogOpen} onClose={() => setCodeDialogOpen(false)}>
        <DialogTitle>Join Code</DialogTitle>
        <DialogContent>
          {codeDialogLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
              <CircularProgress size={24} />
            </Box>
          ) : codeDialogError ? (
            <Typography color="error">{codeDialogError}</Typography>
          ) : viewedCode ? (
            <>
              <DialogContentText sx={{ mb: 1 }}>
                Share this code with others so they can join:
              </DialogContentText>
              <JoinCodeDisplay code={viewedCode} />
            </>
          ) : (
            <DialogContentText>
              This household doesn't have a shareable join code.
            </DialogContentText>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCodeDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Join household */}
      <Dialog open={joinOpen} onClose={() => (joining ? null : setJoinOpen(false))}>
        <DialogTitle>Join Household</DialogTitle>
        <Box component="form" onSubmit={handleJoin}>
          <DialogContent>
            <TextField
              autoFocus
              fullWidth
              label="8-digit join code"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.replace(/\D/g, '').slice(0, 8))}
              disabled={joining}
              slotProps={{ htmlInput: { inputMode: 'numeric', pattern: '[0-9]*' } }}
            />
            <FormControl sx={{ mt: 2 }}>
              <FormLabel>Bring your existing ingredients and recipes?</FormLabel>
              <RadioGroup
                row
                value={migrateChoice}
                onChange={(e) => setMigrateChoice(e.target.value as 'yes' | 'no')}
              >
                <FormControlLabel value="no" control={<Radio />} label="No, keep them in Personal" />
                <FormControlLabel value="yes" control={<Radio />} label="Yes, copy them over" />
              </RadioGroup>
            </FormControl>
            {joinError && (
              <Typography color="error" sx={{ mt: 1 }}>
                {joinError}
              </Typography>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setJoinOpen(false)} disabled={joining}>
              Cancel
            </Button>
            <Button type="submit" disabled={joining || joinCode.length !== 8}>
              Join
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Container>
  );
}
