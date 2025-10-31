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
    parsed.getFullYear() === now.getFullYear() &&
    parsed.getMonth() === now.getMonth() &&
    parsed.getDate() === now.getDate() &&
    parsed.getHours() === now.getHours() &&
    (parsed.getMinutes() === now.getMinutes() || parsed.getMinutes() === now.getMinutes() - 1)
  );
};
