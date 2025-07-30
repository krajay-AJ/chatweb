import React, { useEffect, useState } from 'react';
import SignUp from './Login';
import LoginPage from './LoginPage';
import {
  AppBar,
  Box,
  Container,
  CssBaseline,
  Paper,
  TextField,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  Toolbar,
  Avatar,
  IconButton,
  Badge,
} from '@mui/material';
import { Send as SendIcon, Person as PersonIcon, Logout as LogoutIcon, Search as SearchIcon } from '@mui/icons-material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import io, { Socket } from 'socket.io-client';

interface Message {
  id: string;
  content: string;
  senderId: string;
  timestamp: string;
  type: 'text' | 'system';
}

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});


function App() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [connectedUser, setConnectedUser] = useState<string | null>(null);
  const [user, setUser] = useState<null | { email: string; password: string; username: string; gender: string }>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Check for existing session on app start
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const savedUser = localStorage.getItem('currentUser');

    if (token && savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
      } catch (error) {
        console.error('Error parsing saved user data:', error);
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
      }
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    // Generate a userId based on username for demo (in real app, use backend id)
    const generatedUserId = user.username + '-' + Math.random().toString(36).substr(2, 6);
    setUserId(generatedUserId);

    // Connect to Socket.IO server
    const socketUrl = 'http://localhost:3001';

    console.log('🔧 Debug: Current hostname:', window.location.hostname);
    console.log('🔧 Debug: Socket URL:', socketUrl);
    console.log('🔧 Debug: User:', user.username);

    const newSocket = io(socketUrl, {
      auth: {
        token: 'demo-token',
        username: user.username,
        email: user.email,
        gender: user.gender
      },
      // Try multiple transports
      transports: ['polling', 'websocket'],
      // Increase timeout and retry attempts
      timeout: 30000,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      // Add extra options for ngrok
      forceNew: true,
      upgrade: true
    });

    // Add more detailed logging
    newSocket.on('connecting', () => {
      console.log('🔄 Socket.IO: Attempting to connect...');
    });

    newSocket.on('connect', () => {
      console.log('✅ Socket.IO: Connected successfully!', newSocket.id);
      setIsConnected(true);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        content: 'Welcome to Anonymous Chat! You are now connected.',
        senderId: 'system',
        timestamp: new Date().toISOString(),
        type: 'system'
      }]);
    });

    newSocket.on('connect_error', (error) => {
      console.log('❌ Socket.IO: Connection error:', error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        content: `Failed to connect to chat server: ${error.message}. Please check if the server is running.`,
        senderId: 'system',
        timestamp: new Date().toISOString(),
        type: 'system'
      }]);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('🔌 Socket.IO: Disconnected:', reason);
      setIsConnected(false);
    });

    newSocket.on('reconnect_attempt', (attemptNumber) => {
      console.log('🔄 Socket.IO: Reconnect attempt:', attemptNumber);
    });

    newSocket.on('reconnect_error', (error) => {
      console.log('❌ Socket.IO: Reconnect error:', error);
    });

    newSocket.on('new_message', (message: Message) => {
      console.log('📨 Socket.IO: New message received:', message);
      setMessages(prev => [...prev, message]);
    });

    // Listen for user matching events
    newSocket.on('user_found', (data: { username: string }) => {
      setIsScanning(false);
      setConnectedUser(data.username);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        content: `Connected with ${data.username}! You can now start chatting.`,
        senderId: 'system',
        timestamp: new Date().toISOString(),
        type: 'system'
      }]);
    });

    newSocket.on('user_disconnected', () => {
      setConnectedUser(null);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        content: 'The other user has disconnected. Click "Find" to search for another user.',
        senderId: 'system',
        timestamp: new Date().toISOString(),
        type: 'system'
      }]);
    });

    newSocket.on('scanning_timeout', () => {
      setIsScanning(false);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        content: 'No users found. Try again later.',
        senderId: 'system',
        timestamp: new Date().toISOString(),
        type: 'system'
      }]);
    });

    setSocket(newSocket);
    return () => {
      newSocket.close();
    };
  }, [user]);

  const handleLogout = () => {
    // Clear user data and tokens
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    setUser(null);
    setMessages([]);
    setIsConnected(false);
    setIsScanning(false);
    setConnectedUser(null);
    if (socket) {
      socket.disconnect();
    }
  };

  const handleFind = () => {
    if (!socket || !user) return;

    if (isScanning) {
      // Stop scanning
      setIsScanning(false);
      socket.emit('stop_scanning');
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        content: 'Stopped searching for users.',
        senderId: 'system',
        timestamp: new Date().toISOString(),
        type: 'system'
      }]);
    } else {
      // Start scanning
      setIsScanning(true);
      setConnectedUser(null);
      socket.emit('find_user', { username: user.username });
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        content: 'Searching for available users...',
        senderId: 'system',
        timestamp: new Date().toISOString(),
        type: 'system'
      }]);
    }
  };

  const sendMessage = () => {
    if (newMessage.trim() && socket && isConnected && user) {
      // Check if user is connected to someone
      if (!connectedUser) {
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          content: 'You need to find and connect with another user first. Click the "Find" button below.',
          senderId: 'system',
          timestamp: new Date().toISOString(),
          type: 'system'
        }]);
        return;
      }

      const message: Message = {
        id: Date.now().toString(),
        content: newMessage,
        senderId: user.username,
        timestamp: new Date().toISOString(),
        type: 'text'
      };

      // Add message to local state immediately
      setMessages(prev => [...prev, message]);

      // Send to server
      socket.emit('send_message', {
        content: newMessage,
        type: 'text'
      });

      setNewMessage('');
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  if (!user) {
    if (showLogin) {
      return (
        <>
          <LoginPage
            onLogin={({ identifier, password }) => {
              // Login is now handled in LoginPage component with backend API
              // This callback will only be called on successful login
              const savedUser = localStorage.getItem('currentUser');
              if (savedUser) {
                const userData = JSON.parse(savedUser);
                setUser({
                  email: userData.email,
                  username: userData.username,
                  password: '', // Don't store password
                  gender: userData.gender,
                });
              }
            }}
            onForgotPassword={(email) => {
              // In a real app, this would call the backend forgot password API
              alert('Password reset feature will be implemented with email service.');
            }}
          />
          {loginError && (
            <Box sx={{ mt: 1, textAlign: 'center' }}>
              <Typography color="error">{loginError}</Typography>
            </Box>
          )}
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Button onClick={() => { setShowLogin(false); setLoginError(null); }} size="small">Don't have an account? Sign Up</Button>
          </Box>
        </>
      );
    } else {
      return (
        <>
          <SignUp
            onSignUp={userData => {
              // Registration is now handled in SignUp component with backend API
              // This callback will only be called on successful registration
              setUser(userData);
            }}
          />
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Button onClick={() => setShowLogin(true)} size="small">Already have an account? Login</Button>
          </Box>
        </>
      );
    }
  } return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        <AppBar position="static">
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Anonymous Chat Platform
            </Typography>
            <Typography variant="body2" sx={{ mr: 2 }}>
              Welcome, {user?.username}
            </Typography>
            <Badge color="secondary" variant="dot" invisible={!isConnected}>
              <IconButton color="inherit">
                <PersonIcon />
              </IconButton>
            </Badge>
            <Typography variant="body2" sx={{ ml: 1, mr: 2 }}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </Typography>
            <Button
              color="inherit"
              startIcon={<LogoutIcon />}
              onClick={handleLogout}
              sx={{ textTransform: 'none' }}
            >
              Logout
            </Button>
          </Toolbar>
        </AppBar>

        <Container maxWidth="md" sx={{ flex: 1, display: 'flex', flexDirection: 'column', py: 2 }}>
          <Paper
            elevation={3}
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}
          >
            {/* Messages Area */}
            <Box sx={{ flex: 1, overflow: 'auto', p: 1 }}>
              <List>
                {messages.map((message) => (
                  <ListItem key={message.id} alignItems="flex-start">
                    <Avatar sx={{ mr: 2, bgcolor: message.type === 'system' ? 'grey.500' : 'primary.main' }}>
                      {message.type === 'system' ? '🤖' : message.senderId === userId ? 'You' : 'User'}
                    </Avatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="subtitle2" component="span">
                            {message.type === 'system' ? 'System' : message.senderId === userId ? 'You' : 'Anonymous User'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(message.timestamp).toLocaleTimeString()}
                          </Typography>
                        </Box>
                      }
                      secondary={
                        <Typography
                          variant="body1"
                          color={message.type === 'system' ? 'text.secondary' : 'text.primary'}
                          sx={{ mt: 0.5 }}
                        >
                          {message.content}
                        </Typography>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </Box>

            {/* Message Input */}
            <Paper
              elevation={1}
              sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}
            >
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  fullWidth
                  multiline
                  maxRows={3}
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={!isConnected}
                  variant="outlined"
                  size="small"
                />
                <Button
                  variant="contained"
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || !isConnected}
                  sx={{ minWidth: 48, height: 40 }}
                >
                  <SendIcon />
                </Button>
              </Box>
              {!isConnected && (
                <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
                  Disconnected from server. Check your connection.
                </Typography>
              )}
            </Paper>
          </Paper>

          {/* Find Button at the bottom */}
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
            <Button
              variant={isScanning ? "contained" : "outlined"}
              startIcon={<SearchIcon />}
              onClick={handleFind}
              sx={{ textTransform: 'none' }}
              color={isScanning ? "secondary" : "primary"}
            >
              {isScanning ? 'Stop Scanning' : 'Find'}
            </Button>
          </Box>

          {/* Connection Status */}
          {connectedUser && (
            <Box sx={{ mt: 1, display: 'flex', justifyContent: 'center' }}>
              <Typography variant="body2" color="success.main">
                Connected with: {connectedUser}
              </Typography>
            </Box>
          )}
        </Container>
      </Box>
    </ThemeProvider>
  );
}

export default App;
