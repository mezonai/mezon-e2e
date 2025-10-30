// import { MezonLoginScreen, HomeScreen } from '../screenobjects/index.js';
// import {
//   ClanMenuScreen,
//   ClanMenuActionButtonsComponent,
//   ClanMenuListComponent,
// } from '../screenobjects/home/clan-menu/index.js';

// import { sleep } from '../utils/sleep.js';

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

// describe('Create Clan E2E Tests', function () {
//   let mezonLoginScreen = MezonLoginScreen.init();

//   before(async () => {
//     await mezonLoginScreen.login(
//       AccountCredentials.account1.email,
//       AccountCredentials.account1.password
//     );
//   });

//   it('Should create Clan', async function () {
//     await HomeScreen.using(async home => {
//       const createClanModal = await home.openCreateClanModal();
//       await createClanModal.setClanName(`Test Clan${Date.now()}`);
//       await createClanModal.uploadImage(async upload => {
//         const smallAvatarPath = await upload.createFileWithSize(
//           `small_avatar_${Date.now()}`,
//           800 * 1024,
//           'jpg'
//         );
//         return smallAvatarPath;
//       });
//       await sleep(2000);
//       await createClanModal.createClan();
//     });

//     await ClanMenuScreen.using(async clanMenu => {
//       await clanMenu.openFromHeader();
//       await clanMenu.waitForIsShown();
//     });

//     await ClanMenuActionButtonsComponent.clickByTitle('Lời mời');

//     const menu = new ClanMenuListComponent();
//     await menu.clickItem('Đánh dấu là đã đọc');
//     await menu.clickItem('Tạo danh mục');
//     await menu.clickItem('Tạo sự kiện');
//     await menu.toggleShowEmptyCategories();
//   });
// });
