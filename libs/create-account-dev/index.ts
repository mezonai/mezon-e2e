import { Client } from 'mezon-js';
const mezonClient = new Client('defaultkey', 'dev-mezon.nccsoft.vn', '8088', true);
const email = `dung.buihuu+05@ncc.asia`;
(async () => {
  try {
    const username = email.split('@')[0];
    const auth = await mezonClient.authenticateEmailOTPRequest(email, username);
    console.log('Authenticated:', auth);
    process.exit(0);
  } catch (error) {
    console.error(error);
  }
})();
