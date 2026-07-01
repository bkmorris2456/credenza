import Alert from '@mui/material/Alert';

interface Props {
  lowCount: number;
  outCount: number;
}

/** Banner shown at the top of the ingredient list when stock is low. */
export default function LowStockToast({ lowCount, outCount }: Props) {
  if (lowCount === 0 && outCount === 0) return null;

  const parts: string[] = [];
  if (outCount > 0) parts.push(`${outCount} item${outCount > 1 ? 's' : ''} out of stock`);
  if (lowCount > 0) parts.push(`${lowCount} item${lowCount > 1 ? 's' : ''} running low`);

  return (
    <Alert severity={outCount > 0 ? 'error' : 'warning'} sx={{ mb: 2 }}>
      {parts.join(' · ')}
    </Alert>
  );
}
