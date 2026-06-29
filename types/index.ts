export interface User {
  username: string;
  online: boolean;
  lastSeen?: Date;
  lastMessage?: string;
  lastMessageStatus?: "sending" | "sent" | "delivered" | "seen";
  lastMessageSender?: string;
  lastMessageId?: string;
  unread: number;
  isTyping?: boolean;
}

export interface Message {
  _id?: string;
  clientKey?: string;
  sender: string;
  receiver: string;
  text: string;
  time?: Date;
  createdAt?: Date;
  status?: "sending" | "sent" | "delivered" | "seen";
  seen?: boolean;
  isPinned?: boolean;
  editedAt?: Date;
  replyTo?: {
    messageId: string;
    text: string;
    sender: string;
  };
}