import { MezonLoginScreen } from '../screenobjects/index.js';
import { MailslurpLifecycle } from '../helpers/mailslurp.js';
import { sleep } from '../utils/sleep.js';

import { HomeScreen } from '../screenobjects/home/home.screen.js';
import { WelcomeScreen } from '../screenobjects/welcome.screen.js';
import { UserProfileScreen } from '../screenobjects/user-profile/user-profile.screen.js';

import {
  MultiRemoteProvider,
  installSessionScopedGlobals,
  ManageDrive,
} from '../manage-drive/index.js';

// export const AccountCredentials = {
//   account1: {
//     email: 'dipomo2129@fintehs.com',
//     password: 'Ncc@1234',
//   },
//   account2: {
//     email: '1u4hcaf0gq@cmhvzylmfc.com',
//     password: 'Ncc@1234',
//   },
//   account3: {
//     email: 'qx4ve8xqrx@mrotzis.com',
//     password: 'Ncc@1234',
//   },
//   account4: {
//     email: 'y55salymor@zudpck.com',
//     password: 'Ncc@1234',
//   },
//   account5: {
//     email: '8f7dzsiezp@wnbaldwy.com',
//     password: 'Ncc@1234',
//   },
//   account6: {
//     email: 's9zv9aygir@ibolinva.com',
//     password: 'Ncc@1234',
//   },
//   account7: {
//     email: '4oi30tgce7@mkzaso.com',
//     password: 'Ncc@1234',
//   },
//   account8: {
//     email: 'aczyp914gy@cmhvzylmfc.com',
//     password: 'Ncc@1234',
//   },
//   account9: {
//     email: 'riuajy8jwc@cmhvzylmfc.com',
//     password: 'Ncc@1234',
//   },
// };

const accountEmail = {
  account1: {
    email: 'mezontest@gmail.com',
    otp: '578098',
    userName: 'Huhui123123',
  },
};

const accountPhone = {
  account1: {
    phone: '397327708',
    otp: '111111',
    userName: 'xuanphuoc1169',
  },
};

describe('Friend Management (Native)', function () {
  let mezonLoginScreen: MezonLoginScreen;
  let welcomeScreen: WelcomeScreen;
  let uninstallSessionGlobals: (() => void) | undefined;
  let manageDrive: ManageDrive;
  let homeScreen: HomeScreen;
  let userProfileScreen: UserProfileScreen;
  before(async () => {
    mezonLoginScreen = MezonLoginScreen.init();
    userProfileScreen = UserProfileScreen.init();
    if ((browser as any)?.isMultiremote) {
      const mr = MultiRemoteProvider.from();
      uninstallSessionGlobals = installSessionScopedGlobals(mr.all());
      manageDrive = ManageDrive.init(mr);
    }
    homeScreen = HomeScreen.init();
  });

  afterEach(async () => {
    await browser.reloadSession();
  });

  beforeEach(async () => {
    await MultiRemoteProvider.from().parallel({
      driverA: async () => {
        await manageDrive.withDriverA(async () => {
          await WelcomeScreen.using(async ws => {
            await ws.waitForIsShown(true);
            await ws.clickStartedButton();
            return ws;
          });
          await mezonLoginScreen.loginWithEmail(
            accountEmail.account1.email,
            accountEmail.account1.otp
          );
        });
      },

      driverB: async () => {
        await manageDrive.withDriverB(async () => {
          await WelcomeScreen.using(async ws => {
            await ws.waitForIsShown(true);
            await ws.clickStartedButton();
            return ws;
          });
          await mezonLoginScreen.loginWithPhone(
            accountPhone.account1.phone,
            accountPhone.account1.otp
          );
        });
      },
    });
  });

  after(async () => {
    if (uninstallSessionGlobals) {
      uninstallSessionGlobals();
      uninstallSessionGlobals = undefined;
    }
  });

  it('Verify that a user can send and accept a friend request', async () => {
    await manageDrive.withDriverA(async () => {
      await homeScreen.openProfile();
      const friendScreen = await userProfileScreen.openYourFriends();
      await friendScreen.sendFriendRequestToUser(accountPhone.account1.userName);
    });

    await manageDrive.withDriverB(async () => {
      await homeScreen.openProfile();
      const friendScreen = await userProfileScreen.openYourFriends();
      await friendScreen.acceptFriendRequest(accountEmail.account1.userName);
    });
  });
});
