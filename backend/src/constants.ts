export enum SocketEvent {
  JOIN = "join",
  LEAVE = "leave", // <-- new
  SEND_MESSAGE = "send_message",
  RECEIVE_MESSAGE = "receive_message",
  LOAD_MESSAGES = "load_messages",
  TYPING = "typing",
  STOP_TYPING = "stop_typing",
  ONLINE_USERS = "online_users",
}
