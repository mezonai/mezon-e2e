export enum ChannelType {
  TEXT = 'TEXT',
  VOICE = 'VOICE',
  STREAM = 'STREAM',
}

export enum ChannelStatus {
  PUBLIC = 'PUBLIC',
  PRIVATE = 'PRIVATE',
}

export enum ThreadStatus {
  PUBLIC = 'PUBLIC',
  PRIVATE = 'PRIVATE',
}

export enum TypeMessage {
  Chat = 0,
  ChatUpdate = 1,
  ChatRemove = 2,
  Typing = 3,
  Indicator = 4,
  Welcome = 5,
  CreateThread = 6,
  CreatePin = 7,
  MessageBuzz = 8,
  Topic = 9,
  AuditLog = 10,
  SendToken = 11,
  Ephemeral = 12,
  UpcomingEvent = 13,
}
