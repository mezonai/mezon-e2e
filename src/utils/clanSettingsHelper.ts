export const isWebhookJustCreated = (dataString: string): boolean => {
  const match = dataString.match(/on\s+([A-Za-z]{3}\s+[A-Za-z]{3}\s+\d{1,2}\s*-\s*\d{2}:\d{2})/);
  if (!match) return false;

  const timeStr = match[1];
  const parts = timeStr.split(' ');
  const month = parts[1];
  const day = parseInt(parts[2]);
  const [hours, minutes] = parts[4].split(':').map(Number);

  const now = new Date();
  const parsed = new Date(
    now.getFullYear(),
    new Date(`${month} 1`).getMonth(),
    day,
    hours,
    minutes
  );

  return (
    parsed.getFullYear() === now.getUTCFullYear() &&
    parsed.getMonth() === now.getUTCMonth() &&
    parsed.getDate() === now.getUTCDate() &&
    parsed.getHours() === now.getUTCHours() &&
    (parsed.getMinutes() === now.getUTCMinutes() || parsed.getMinutes() === now.getUTCMinutes() - 1)
  );
};
