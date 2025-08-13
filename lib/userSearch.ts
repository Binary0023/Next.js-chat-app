import { ref, get } from 'firebase/database';
import { database } from './firebase';
import { User } from './types';

export const searchUsers = async (searchTerm: string): Promise<User[]> => {
  if (!searchTerm || searchTerm.length < 2) {
    return [];
  }

  const results: User[] = [];
  const searchLower = searchTerm.toLowerCase();

  try {
    // Search by username
    const usersRef = ref(database, 'users');
    const snapshot = await get(usersRef);
    
    if (snapshot.exists()) {
      const users = snapshot.val();
      
      Object.keys(users).forEach(uid => {
        const user = users[uid];
        if (user && (
          user.username?.toLowerCase().includes(searchLower) ||
          user.displayName?.toLowerCase().includes(searchLower) ||
          user.email?.toLowerCase().includes(searchLower)
        )) {
          results.push({ ...user, uid });
        }
      });
    }
  } catch (error) {
    console.error('Error searching users:', error);
  }

  return results.slice(0, 20); // Limit to 20 results
};

export const getUserByUsername = async (username: string): Promise<User | null> => {
  try {
    const usernamesRef = ref(database, 'usernames');
    const snapshot = await get(usernamesRef);
    
    if (snapshot.exists()) {
      const usernames = snapshot.val();
      
      // Find user ID by username
      const userId = Object.keys(usernames).find(
        uid => usernames[uid] === username.toLowerCase()
      );
      
      if (userId) {
        const userRef = ref(database, `users/${userId}`);
        const userSnapshot = await get(userRef);
        
        if (userSnapshot.exists()) {
          return { ...userSnapshot.val(), uid: userId };
        }
      }
    }
  } catch (error) {
    console.error('Error getting user by username:', error);
  }
  
  return null;
};