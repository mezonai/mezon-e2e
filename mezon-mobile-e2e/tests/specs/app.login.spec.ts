import { MezonLoginScreen } from '../screenobjects/index.js';
import { MailslurpLifecycle } from '../helpers/mailslurp.js';
import { sleep } from '../utils/sleep.js';

import { HomeScreen } from '../screenobjects/home/home.screen.js';
import { WelcomeScreen } from '../screenobjects/welcome.screen.js';

import {
  MultiRemoteProvider,
  installSessionScopedGlobals,
  ManageDrive,
} from '../manage-drive/index.js';

export const AccountCredentials = {
  account1: {
    email: 'dipomo2129@fintehs.com',
    password: 'Ncc@1234',
  },
  account2: {
    email: '1u4hcaf0gq@cmhvzylmfc.com',
    password: 'Ncc@1234',
  },
  account3: {
    email: 'qx4ve8xqrx@mrotzis.com',
    password: 'Ncc@1234',
  },
  account4: {
    email: 'y55salymor@zudpck.com',
    password: 'Ncc@1234',
  },
  account5: {
    email: '8f7dzsiezp@wnbaldwy.com',
    password: 'Ncc@1234',
  },
  account6: {
    email: 's9zv9aygir@ibolinva.com',
    password: 'Ncc@1234',
  },
  account7: {
    email: '4oi30tgce7@mkzaso.com',
    password: 'Ncc@1234',
  },
  account8: {
    email: 'aczyp914gy@cmhvzylmfc.com',
    password: 'Ncc@1234',
  },
  account9: {
    email: 'riuajy8jwc@cmhvzylmfc.com',
    password: 'Ncc@1234',
  },
};

describe('Mezon Login (Native)', function () {
  let mezonLoginScreen: MezonLoginScreen;
  let welcomeScreen: WelcomeScreen;
  let uninstallSessionGlobals: (() => void) | undefined;
  let manageDrive: ManageDrive;

  before(async () => {
    await WelcomeScreen.using(async ws => {
      await ws.waitForIsShown(true);
      await ws.clickStartedButton();
      return ws;
    });
    mezonLoginScreen = MezonLoginScreen.init();
    if ((browser as any)?.isMultiremote) {
      const mr = MultiRemoteProvider.from();
      uninstallSessionGlobals = installSessionScopedGlobals(mr.all());
      manageDrive = ManageDrive.init(mr);
    }
  });

  after(async () => {
    if (uninstallSessionGlobals) {
      uninstallSessionGlobals();
      uninstallSessionGlobals = undefined;
    }
  });

  it('Should login with Password', async function () {
    await manageDrive.withDriverA(async () => {
      await mezonLoginScreen.loginWithPassword(
        AccountCredentials.account1.email,
        AccountCredentials.account1.password
      );

      await HomeScreen.using(async home => {
        const createClanModal = await home.openCreateClanModal();
        await createClanModal.setClanName(`Test Clan${Date.now()}`);
        await createClanModal.uploadImage(async upload => {
          const smallAvatarPath = await upload.createFileWithSize(
            `small_avatar_${Date.now()}`,
            800 * 1024,
            'jpg'
          );
          return smallAvatarPath;
        });
        await sleep(2000);
        await createClanModal.createClan();
      });
    });
  });

  it('Should login with password (Dual User)', async function () {
    await manageDrive.withDriverA(async () => {
      await mezonLoginScreen.loginWithPassword(
        AccountCredentials.account1.email,
        AccountCredentials.account1.password
      );
    });

    await manageDrive.withDriverB(async () => {
      await mezonLoginScreen.loginWithPassword(
        AccountCredentials.account2.email,
        AccountCredentials.account2.password
      );
    });

    await manageDrive.withDriverC(async () => {
      await mezonLoginScreen.loginWithPassword(
        AccountCredentials.account3.email,
        AccountCredentials.account3.password
      );
    });

    await manageDrive.withDriverD(async () => {
      await mezonLoginScreen.loginWithPassword(
        AccountCredentials.account4.email,
        AccountCredentials.account4.password
      );
    });
  });
});
