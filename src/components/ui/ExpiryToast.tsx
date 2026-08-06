import Alert from '@mui/material/Alert';

interface Props {
  expiredCount: number;
  expiringCount: number;
  warningDays: number;
}

/** Banner shown at the top of the ingredient list when items are expired or expiring soon. */
export default function ExpiryToast({ expiredCount, expiringCount, warningDays }: Props) {
  if (expiredCount === 0 && expiringCount === 0) return null;

  const parts: string[] = [];
  if (expiredCount > 0) parts.push(`${expiredCount} item${expiredCount > 1 ? 's' : ''} expired`);
  if (expiringCount > 0)
    parts.push(
      `${expiringCount} item${expiringCount > 1 ? 's' : ''} expiring within ${warningDays} day${warningDays > 1 ? 's' : ''}`
    );

  return (
    <Alert severity={expiredCount > 0 ? 'error' : 'warning'} sx={{ mb: 2 }}>
      {parts.join(' · ')}
    </Alert>
  );
}
