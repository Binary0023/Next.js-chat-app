import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from './firebase';

export const uploadFile = async (file: File, path: string): Promise<string> => {
  const storageRef = ref(storage, path);
  const snapshot = await uploadBytes(storageRef, file);
  return await getDownloadURL(snapshot.ref);
};

export const uploadChatMedia = async (file: File, chatId: string, messageId: string): Promise<string> => {
  const fileExtension = file.name.split('.').pop();
  const fileName = `${messageId}.${fileExtension}`;
  const path = `chats/${chatId}/media/${fileName}`;
  return await uploadFile(file, path);
};

export const uploadProfilePicture = async (file: File, userId: string): Promise<string> => {
  const fileExtension = file.name.split('.').pop();
  const fileName = `profile.${fileExtension}`;
  const path = `users/${userId}/${fileName}`;
  return await uploadFile(file, path);
};

export const uploadGroupPhoto = async (file: File, groupId: string): Promise<string> => {
  const fileExtension = file.name.split('.').pop();
  const fileName = `group.${fileExtension}`;
  const path = `groups/${groupId}/${fileName}`;
  return await uploadFile(file, path);
};

export const uploadStatus = async (file: File, userId: string, statusId: string): Promise<string> => {
  const fileExtension = file.name.split('.').pop();
  const fileName = `${statusId}.${fileExtension}`;
  const path = `status/${userId}/${fileName}`;
  return await uploadFile(file, path);
};

export const deleteFile = async (url: string): Promise<void> => {
  const fileRef = ref(storage, url);
  await deleteObject(fileRef);
};