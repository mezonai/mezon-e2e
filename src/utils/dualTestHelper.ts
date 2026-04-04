export function getUsernamesFromEmails(emails: string[]): string[] {
  return emails.map(email => email.split('@')[0]);
}
