import { ref, push, set, get, onValue } from 'firebase/database';
import { database } from './firebase';
import { Chat, Message } from './types';
import { encryptMessage, decryptMessage } from './encryption';

export const createPrivateChat = async (userId1: string, userId2: string): Promise<string> => {
  // Check if chat already exists
  const chatsRef = ref(database, 'chats');
  const snapshot = await get(chatsRef);

  if (snapshot.exists()) {
    const chats = snapshot.val();
    for (const chatId in chats) {
      const chat = chats[chatId];
      if (chat && chat.type === 'private' &&
        chat.participants && Array.isArray(chat.participants) &&
        chat.participants.includes(userId1) &&
        chat.participants.includes(userId2)) {
        return chatId;
      }
    }
  }

  // Create new chat
  const newChatRef = push(ref(database, 'chats'));
  const chatData: Omit<Chat, 'id'> = {
    type: 'private',
    participants: [userId1, userId2],
    lastActivity: Date.now(),
    unreadCount: { [userId1]: 0, [userId2]: 0 },
  };

  await set(newChatRef, chatData);
  return newChatRef.key!;
};

export const createGroupChat = async (creatorId: string, participants: string[], groupName: string, groupDescription?: string): Promise<string> => {
  const newChatRef = push(ref(database, 'chats'));
  const chatData: Omit<Chat, 'id'> = {
    type: 'group',
    participants: [creatorId, ...participants],
    lastActivity: Date.now(),
    unreadCount: participants.reduce((acc, id) => ({ ...acc, [id]: 0 }), { [creatorId]: 0 }),
    groupName,
    groupDescription,
    adminIds: [creatorId],
    createdBy: creatorId,
    createdAt: Date.now(),
  };

  await set(newChatRef, chatData);
  return newChatRef.key!;
};

export const sendMessage = async (chatId: string, senderId: string, content: string, type: Message['type'] = 'text', mediaUrl?: string, mediaName?: string, mediaSize?: number) => {
  const messageRef = push(ref(database, `messages/${chatId}`));
  const encryptedContent = type === 'text' ? encryptMessage(content) : content;

  const messageData: Omit<Message, 'id'> = {
    senderId,
    content: encryptedContent,
    type,
    timestamp: Date.now(),
    readBy: { [senderId]: Date.now() },
    ...(mediaUrl && { mediaUrl }),
    ...(mediaName && { mediaName }),
    ...(mediaSize && { mediaSize }),
  };

  await set(messageRef, messageData);

  // Update chat's last message and activity
  const chatRef = ref(database, `chats/${chatId}`);
  const chatSnapshot = await get(chatRef);

  if (chatSnapshot.exists()) {
    const chat = chatSnapshot.val();
    const updates: any = {
      lastMessage: { ...messageData, id: messageRef.key },
      lastActivity: Date.now(),
    };

    // Update unread count for other participants
    const unreadCount = { ...chat.unreadCount };
    if (chat.participants && Array.isArray(chat.participants)) {
      chat.participants.forEach((participantId: string) => {
        if (participantId !== senderId) {
          unreadCount[participantId] = (unreadCount[participantId] || 0) + 1;
        }
      });
    }
    updates.unreadCount = unreadCount;

    await set(chatRef, { ...chat, ...updates });
  }

  return messageRef.key!;
};

export const markMessagesAsRead = async (chatId: string, userId: string) => {
  const messagesRef = ref(database, `messages/${chatId}`);
  const snapshot = await get(messagesRef);

  if (snapshot.exists()) {
    const messages = snapshot.val();
    const updates: any = {};

    Object.keys(messages).forEach(messageId => {
      const message = messages[messageId];
      if (message.senderId !== userId && !message.readBy?.[userId]) {
        updates[`messages/${chatId}/${messageId}/readBy/${userId}`] = Date.now();
      }
    });

    if (Object.keys(updates).length > 0) {
      // Use update instead of set to avoid overwriting
      const { update } = await import('firebase/database');
      await update(ref(database), updates);
    }
  }

  // Reset unread count
  await set(ref(database, `chats/${chatId}/unreadCount/${userId}`), 0);
};

export const editMessage = async (chatId: string, messageId: string, newContent: string) => {
  const messageRef = ref(database, `messages/${chatId}/${messageId}`);
  const snapshot = await get(messageRef);

  if (snapshot.exists()) {
    const message = snapshot.val();
    const encryptedContent = encryptMessage(newContent);

    await set(messageRef, {
      ...message,
      content: encryptedContent,
      edited: true,
      editedAt: Date.now(),
    });
  }
};

export const deleteMessage = async (chatId: string, messageId: string) => {
  const messageRef = ref(database, `messages/${chatId}/${messageId}`);
  const snapshot = await get(messageRef);

  if (snapshot.exists()) {
    const message = snapshot.val();
    await set(messageRef, {
      ...message,
      deleted: true,
      deletedAt: Date.now(),
      content: encryptMessage('This message was deleted'),
    });
  }
};

export const addReaction = async (chatId: string, messageId: string, userId: string, reaction: string) => {
  const reactionRef = ref(database, `messages/${chatId}/${messageId}/reactions/${userId}`);
  await set(reactionRef, reaction);
};

export const removeReaction = async (chatId: string, messageId: string, userId: string) => {
  const reactionRef = ref(database, `messages/${chatId}/${messageId}/reactions/${userId}`);
  await set(reactionRef, null);
};

export const starMessage = async (chatId: string, messageId: string, starred: boolean) => {
  const messageRef = ref(database, `messages/${chatId}/${messageId}/starred`);
  await set(messageRef, starred);
};

export const getUserChats = (userId: string, callback: (chats: Chat[]) => void) => {
  const chatsRef = ref(database, 'chats');

  const unsubscribe = onValue(chatsRef, (snapshot) => {
    if (snapshot.exists()) {
      const chatsData = snapshot.val();
      const userChats: Chat[] = [];

      Object.keys(chatsData).forEach(chatId => {
        const chat = chatsData[chatId];
        if (chat && chat.participants && Array.isArray(chat.participants) && chat.participants.includes(userId)) {
          userChats.push({ ...chat, id: chatId });
        }
      });

      // Sort by last activity
      userChats.sort((a, b) => b.lastActivity - a.lastActivity);
      callback(userChats);
    } else {
      callback([]);
    }
  });

  return unsubscribe;
};

export const getChatMessages = (chatId: string, callback: (messages: Message[]) => void) => {
  const messagesRef = ref(database, `messages/${chatId}`);

  const unsubscribe = onValue(messagesRef, (snapshot) => {
    if (snapshot.exists()) {
      const messagesData = snapshot.val();
      const messages: Message[] = Object.keys(messagesData).map(messageId => {
        const message = messagesData[messageId];
        return {
          ...message,
          id: messageId,
          content: message.type === 'text' ? decryptMessage(message.content) : message.content,
        };
      });

      // Sort by timestamp
      messages.sort((a, b) => a.timestamp - b.timestamp);
      callback(messages);
    } else {
      callback([]);
    }
  });

  return unsubscribe;
};