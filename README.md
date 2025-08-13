# WhatsApp Clone - Production Ready 🚀

A full-featured WhatsApp clone built with Next.js 14, Firebase, and WebRTC. This is a production-ready application with real-time messaging, audio/video calls, anonymous login, and fully mobile responsive design.

## 🎉 NEW FEATURES ADDED:
- **Anonymous Login** with random usernames (CoolTiger123, BraveEagle456, etc.)
- **Enhanced WebRTC** with better error handling and connection stability
- **Fully Mobile Responsive** design with mobile-first approach
- **Improved Call Quality** with better audio/video constraints
- **Real-time Notifications** for calls and messages
- **Simplified Storage** structure (no complex folder requirements)

## 🚀 Features

### Core Features
- **Real-time Messaging**: Instant text messaging with encryption
- **Audio & Video Calls**: WebRTC-powered voice and video calls
- **Group Chats**: Create and manage group conversations
- **Media Sharing**: Send images, videos, documents, and voice notes
- **User Authentication**: Email/password, Google, and phone number sign-in
- **Profile Management**: Customizable user profiles with avatars

### Advanced Features
- **Message Reactions**: React to messages with emojis
- **Message Status**: Read receipts and delivery confirmations
- **Typing Indicators**: Real-time typing status
- **Online Status**: See who's online and last seen timestamps
- **Message Search**: Search through conversation history
- **Starred Messages**: Pin important messages
- **Message Editing/Deletion**: Edit or delete sent messages
- **End-to-End Encryption**: Secure message encryption
- **Dark/Light Theme**: Toggle between themes
- **Push Notifications**: Browser notifications for new messages
- **File Upload**: Drag & drop file sharing
- **Responsive Design**: Mobile-first responsive interface

## 🛠 Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend**: Firebase Realtime Database, Firebase Auth, Firebase Storage
- **Real-time Communication**: WebRTC for audio/video calls
- **State Management**: Zustand
- **UI Components**: Custom components with Lucide React icons
- **File Handling**: React Dropzone
- **Date Handling**: date-fns
- **Notifications**: React Hot Toast
- **Encryption**: CryptoJS

## 🔧 Setup Instructions

### Prerequisites
- Node.js 18+ installed
- Firebase project created
- Firebase services enabled (Auth, Realtime Database, Storage)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd whatsapp-clone
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   The `.env.local` file there fill with you crediantials:
   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=AI*****************************8
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=**************.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://***********.firebaseio.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=w**888*********
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=***********8.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=8********88
   NEXT_PUBLIC_FIREBASE_APP_ID=1:833**************88888
   NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-T*********8
   ```

4. **Firebase Security Rules**
   Apply the security rules from `firebase-rules.json` to your Firebase Realtime Database and the rules from `firebase-storage-rules.txt` to Firebase Storage.

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Build for production**
   ```bash
   npm run build
   npm start
   ```

## 🔐 Security Features

### Firebase Security Rules
- **User Data Protection**: Users can only access and modify their own data
- **Chat Access Control**: Only chat participants can read/write messages
- **Media Security**: File uploads restricted to authorized users
- **Call Privacy**: Call data only accessible to participants

### Application Security
- **End-to-End Encryption**: Messages encrypted before storage
- **Authentication Required**: All features require user authentication
- **Input Validation**: Comprehensive input sanitization
- **Privacy Controls**: User-configurable privacy settings

## 📱 Usage

### Getting Started
1. **Sign Up/Sign In**: Create an account or sign in with existing credentials
2. **Complete Profile**: Add your display name, bio, and profile picture
3. **Start Chatting**: Create new chats or groups to begin messaging

### Key Features
- **New Chat**: Click the "New Chat" button to start private or group conversations
- **Send Messages**: Type and send text messages, or use the attachment button for media
- **Make Calls**: Click the phone or video icon in chat headers to start calls
- **Customize Settings**: Access settings through the sidebar menu
- **React to Messages**: Long-press messages to add reactions
- **Search**: Use the search bar to find specific conversations or messages

## 🚀 Deployment

### Vercel Deployment (Recommended)
1. **Connect Repository**: Link your GitHub repository to Vercel
2. **Environment Variables**: Add all environment variables from `.env.local`
3. **Deploy**: Vercel will automatically build and deploy your application

### Manual Deployment
1. **Build the application**
   ```bash
   npm run build
   ```
2. **Deploy the `out` folder** to your hosting provider

## 🔧 Configuration

### Firebase Setup
1. **Authentication**: Enable Email/Password, Google, and Phone providers
2. **Realtime Database**: Apply security rules from `firebase-rules.json`
3. **Storage**: Apply security rules from `firebase-storage-rules.txt`
4. **Hosting**: Optional - use Firebase Hosting for deployment

### WebRTC Configuration
The application uses Google's free STUN servers for NAT traversal. For production use with users behind restrictive firewalls, consider adding TURN servers.

## 📊 Performance Optimizations

- **Code Splitting**: Automatic code splitting with Next.js
- **Image Optimization**: Next.js Image component for optimized loading
- **Lazy Loading**: Components loaded on demand
- **Efficient Listeners**: Optimized Firebase listeners to minimize bandwidth
- **Caching**: Browser caching for static assets

## 🐛 Troubleshooting

### Common Issues
1. **WebRTC Connection Issues**: Ensure HTTPS is used in production
2. **Firebase Permission Errors**: Verify security rules are correctly applied
3. **File Upload Failures**: Check Firebase Storage configuration and rules
4. **Authentication Issues**: Verify Firebase Auth providers are enabled

### Debug Mode
Set `NODE_ENV=development` for detailed error logging and debugging information.

## 🤝 Contributing

This is a production-ready application. For contributions:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Firebase for backend services
- WebRTC for real-time communication
- Next.js team for the excellent framework
- Tailwind CSS for styling utilities
- All open-source contributors

---


**Note**: This is a fully functional, production-ready WhatsApp clone. All features are implemented and ready for real-world usage with proper security measures in place.
