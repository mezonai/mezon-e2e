import { Client } from 'mezon-js';
const mezonClient = new Client('defaultkey', 'dev-mezon.nccsoft.vn', '8088', true);
(async () => {
  try {
    const auth = await mezonClient.confirmEmailOTP({
      otp_code: '968405',
      req_id: '1977969930875703296',
    });
    console.log('Authenticated:', auth);
  } catch (error) {
    console.error(error);
  }
})();
