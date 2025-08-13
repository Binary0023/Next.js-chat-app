import CryptoJS from 'crypto-js';

const SECRET_KEY = 'whatsapp-clone-secret-key-2024';

export const encryptMessage = (message: string): string => {
  return CryptoJS.AES.encrypt(message, SECRET_KEY).toString();
};

export const decryptMessage = (encryptedMessage: string): string => {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedMessage, SECRET_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    return encryptedMessage; // Return original if decryption fails
  }
};