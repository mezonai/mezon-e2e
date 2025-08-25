import { test, expect } from '@playwright/test';
import { HomePage } from '../../pages/HomePage';
import { MessgaePage } from '@/pages/MessagePage';
import { OnboardingHelpers } from '@/utils/onboardingHelpers';
import { environment } from '@/config/environment';
import { dir } from 'console';
import { DirectMessageHelper } from '@/utils/directMessageHelper';

test.describe('Onboarding Guide Task Completion', () => {
    test.beforeEach(async ({ page }) => {
        const homePage = new HomePage(page);
        await homePage.navigate();

        const helpers = new OnboardingHelpers(page);
        await helpers.navigateToApp();

        const finalUrl = page.url();
        expect(finalUrl).not.toMatch(environment.authPageRegex);
    });

    const now = new Date();
    const dateTimeString = now.toISOString().replace(/[:.]/g, '-');

    const messageText = `message-text-${dateTimeString}`;
    const nameGroupChat = `name-groupchat-${dateTimeString}`;

    // test('Create direct message ', async ({ page }) => {
    //     const messagePage = new MessgaePage(page);
    //     const helpers = new DirectMessageHelper(page);
    //     const prevUsersCount = await helpers.countUsers();

    //     await test.step(`Creat direct message`, async () => {
    //         await messagePage.createDM();
    //         await page.waitForTimeout(2000);
    //     });

    //     await test.step('Verify direct message is created', async () => {
    //         const DMCreated = await messagePage.isDMCreated(prevUsersCount);
    //         expect(DMCreated).toBeTruthy();
    //     });
    // });

    // test('Select a conversation', async ({ page }) => {
    //     const messagePage = new MessgaePage(page);

    //     await test.step(`Select a conversation`, async () => {
    //         await messagePage.selectConversation();
    //         await page.waitForTimeout(3000);
    //     });

    //     await test.step('Verify the conversation is selected', async () => {
    //         const conversationSelected = await messagePage.isConversationSelected();
    //         expect(conversationSelected).toBeTruthy();
    //     });
    // });

    // test('Send a message', async ({ page }) => {
    //     const messagePage = new MessgaePage(page);

    //     await test.step(`Send a message`, async () => {
    //         await messagePage.sendMessage(messageText);
    //         await page.waitForTimeout(3000);
    //     });

    //     await test.step('Verify the message is send', async () => {
    //         const messageSend = await messagePage.isMessageSend();
    //         expect(messageSend).toBeTruthy();
    //     });
    // });

    test('Create group chat ', async ({ page }) => {    
        const messagePage = new MessgaePage(page);
        const helpers = new DirectMessageHelper(page);
        const prevGroupCount = await helpers.countGroups();

        await test.step(`Creat group chat`, async () => {
            await messagePage.createGroup();
            await page.waitForTimeout(3000);
        });

        await test.step('Verify group chat is ceated', async () => {
            const groupCreated = await messagePage.isGroupCreated(prevGroupCount);
            expect(groupCreated).toBeTruthy();
        });
    });

    // test('Add more member to group chat', async ({ page }) => {
    //     const messagePage = new MessgaePage(page);
    //     const getMemberCount = await messagePage.getMemberCount();

    //     await test.step(`Add more member to group chat`, async () => {
    //         await messagePage.addMoreMemberToGroup();
    //         await page.waitForTimeout(5000);
    //     });

    //     await test.step('Verify group chat is added more member', async () => {
    //         const memberAdded = await messagePage.isMemberAdded(getMemberCount);
    //         expect(memberAdded).toBeTruthy();
    //     });
    // });

    // test('Update name for group chat DM', async ({ page }) => {
    //     const messagePage = new MessgaePage(page);

    //     await test.step(`Update name for group chat DM`, async () => {
    //         await messagePage.updateNameGroupChatDM(nameGroupChat);
    //         await page.waitForTimeout(3000);
    //     });

    //     await test.step('Verify the group name is updated', async () => {
    //         const groupNameUpdated = await messagePage.isGroupNameDMUpdated();
    //         expect(groupNameUpdated).toBeTruthy();
    //     });
    // });

    // test('Close direct message', async ({ page }) => {
    //     const messagePage = new MessgaePage(page);
    //     const helpers = new DirectMessageHelper(page);
    //     const prevUsersCount = await helpers.countUsers();

    //     await test.step(`Close direct message`, async () => {
    //         await messagePage.closeDM();
    //         await page.waitForTimeout(3000);
    //     });

    //     await test.step('Verify direct message is closed', async () => {
    //         const DMClosed = await messagePage.isDMClosed(prevUsersCount);
    //         expect(DMClosed).toBeTruthy();
    //     });
    // });

    // test('Leave group', async ({ page }) => {
    //     const messagePage = new MessgaePage(page);
    //     const helpers = new DirectMessageHelper(page);
    //     const prevGroupCount = await helpers.countGroups();

    //     await test.step(`Leave group chat`, async () => {
    //         await messagePage.leaveGroupByXBtn();
    //         await page.waitForTimeout(3000);
    //     });

    //     await test.step('Verify group chat is left', async () => {
    //         const groupLeaved = await messagePage.isLeavedGroup(prevGroupCount);
    //         expect(groupLeaved).toBeTruthy();
    //     });
    // });

    // test('Leave group', async ({ page }) => {
    //     const messagePage = new MessgaePage(page);
    //     const helpers = new DirectMessageHelper(page);
    //     const prevGroupCount = await helpers.countGroups();        

    //     await test.step(`Leave group chat`, async () => {
    //         await messagePage.leaveGroupByLeaveGroupBtn();
    //         await page.waitForTimeout(3000);
    //     });

    //     // await test.step('Verify group chat is left', async () => {
    //     //     const groupLeaved = await messagePage.isLeavedGroup(prevGroupCount);
    //     //     expect(groupLeaved).toBeTruthy();
    //     // });
    // });

    // test('Create topic', async ({ page }) => {
    //     const messagePage = new MessgaePage(page);

    //     await test.step(`Create a topic`, async () => {
    //         await messagePage.createTopic(messageText);
    //         await page.waitForTimeout(3000);
    //     });

    //     await test.step('Verify the topic is created', async () => {
    //         const topicCreated = await messagePage.isTopicCreated();
    //         expect(topicCreated).toBeTruthy();
    //     });
    // });   
});

