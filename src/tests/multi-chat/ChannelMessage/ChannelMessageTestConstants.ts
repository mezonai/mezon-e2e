import { MULTI_CHAT_STEPS } from '../MultiChatTestConstants';

export const CHANNEL_MESSAGE_STEPS = {
  ...MULTI_CHAT_STEPS,
  banUserInClan: 'User A ban user B in clan',
  banUserInChannel: 'User A ban user B in channel',
  sendMessageAndCreateTopic: 'User A send a message on channel and create a topic',
  openDirectMessage: 'Open DM between User A and User B',
  createCanvas: 'Create a canvas',
} as const;

export const CHANNEL_MESSAGE_TAGS = {
  clan: 'clan',
  contactCard: 'contact-card',
  share: 'share',
} as const;

export const CHANNEL_MESSAGE_DATA = {
  messageToForward: 'This is a message to forward',
  profileStatus: {
    step: "User A set profile status to 'Do Not Disturb' for '30 Minutes'",
    name: 'Do Not Disturb',
    duration: 'For 30 Minutes',
  },
} as const;
