export function formatDate(timestamp?: number) {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
}

export function bodyPreview(body: string, length = 180) {
  if (!body) return 'No details yet.';
  const normalized = body.replace(/\s+/g, ' ').trim();
  if (normalized.length <= length) return normalized;
  return normalized.slice(0, length - 1) + '…';
}
