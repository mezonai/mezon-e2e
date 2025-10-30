import { Client } from 'mezon-js';
import * as readline from 'readline';

const mezonClient = new Client('defaultkey', 'dev-mezon.nccsoft.vn', '8088', true);
const apiClient = new Client('defaultkey', 'dev-mezon.nccsoft.vn', '7305', true);
const email = `dung.buihuu+mb01@ncc.asia`;
const username = email.split('@')[0];
const password = 'Hello@123';

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Function to prompt for OTP input
const promptOTP = (): Promise<string> => {
  return new Promise(resolve => {
    rl.question('Please enter the OTP code you received: ', answer => {
      resolve(answer.trim());
    });
  });
};

(async () => {
  try {
    console.log(`Requesting OTP for email: ${email}`);
    const auth = await mezonClient.authenticateEmailOTPRequest(email, username);

    console.log(`OTP request sent successfully. Request ID: ${auth.req_id}`);

    // Prompt user for OTP input
    const otpCode = await promptOTP();

    console.log('Confirming OTP...');
    const session = await mezonClient.confirmEmailOTP({
      otp_code: otpCode,
      req_id: auth.req_id,
    });

    console.log('OTP confirmed successfully. Registering password...');
    await apiClient.registrationPassword(session, email, password);

    console.log('Account registration completed successfully!');
    rl.close();
    process.exit(0);
  } catch (error) {
    console.error('Error during registration:', error);
    rl.close();
    process.exit(1);
  }
})();
