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
  CircularProgress,
  Chip,
  Tabs,
  Tab,
} from '@mui/material';
import { Send as SendIcon, Person as PersonIcon, Logout as LogoutIcon, Search as SearchIcon, Phone as PhoneIcon, PhoneDisabled, Mic, MicOff, CallEnd, CallReceived, SignalCellularConnectedNoInternet0Bar, Lock, SmartToy as BotIcon } from '@mui/icons-material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { Dialog, DialogTitle, DialogContent, DialogActions, Alert } from '@mui/material';
import io, { Socket } from 'socket.io-client';
import Peer from 'simple-peer/simplepeer.min.js';
import WhisBot from './services/WhisBot';

interface Message {
  id: string;
  content: string;
  senderId: string;
  timestamp: string;
  type: 'text' | 'system' | 'whisbot';
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

  // Enhanced voice call state
  const [isCallActive, setIsCallActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [callError, setCallError] = useState<string | null>(null);
  const [peer, setPeer] = useState<any | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);

  // New enhanced call features
  const [callState, setCallState] = useState<'idle' | 'calling' | 'ringing' | 'connecting' | 'connected' | 'ended'>('idle');
  const [callDuration, setCallDuration] = useState(0);
  const [callStartTime, setCallStartTime] = useState<Date | null>(null);
  const [audioQuality, setAudioQuality] = useState<'good' | 'poor' | 'unknown'>('unknown');
  const [isEncrypted, setIsEncrypted] = useState(false);
  const [incomingCallFrom, setIncomingCallFrom] = useState<string | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const MAX_RECONNECT_ATTEMPTS = 3;

  // WhisBot AI companion state
  const [whisBot] = useState(new WhisBot());
  const [isChatWithBot, setIsChatWithBot] = useState(false);
  const [botTyping, setBotTyping] = useState(false);
  const [botVibe, setBotVibe] = useState<'friendly' | 'flirty' | 'intellectual' | 'funny'>('friendly');
  const [chatMode, setChatMode] = useState<'human' | 'bot'>('human');

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

  // Call duration timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (callState === 'connected' && callStartTime) {
      interval = setInterval(() => {
        setCallDuration(Math.floor((Date.now() - callStartTime.getTime()) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [callState, callStartTime]);

  // Format call duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (!user) return;
    // Generate a userId based on username for demo (in real app, use backend id)
    const generatedUserId = user.username + '-' + Math.random().toString(36).substr(2, 6);
    setUserId(generatedUserId);

    // Debug: Check if we're using the browser version of simple-peer
    console.log('🔧 Debug: Simple-peer WEBRTC_SUPPORT:', (Peer as any).WEBRTC_SUPPORT);

    // Connect to Socket.IO server - configurable for different environments
    const socketUrl = process.env.REACT_APP_SOCKET_URL || 'http://localhost:3001';

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

    // Voice call event listeners
    newSocket.on('voice_call_initiate', (data) => {
      setIncomingCallFrom(data.from);
      setCallState('ringing');
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        content: `📞 Incoming call from ${data.from}...`,
        senderId: 'system',
        timestamp: new Date().toISOString(),
        type: 'system'
      }]);
    });

    newSocket.on('voice_call_accepted', () => {
      setCallState('connecting');
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        content: '✅ Call accepted. Connecting...',
        senderId: 'system',
        timestamp: new Date().toISOString(),
        type: 'system'
      }]);
    });

    newSocket.on('voice_call_rejected', () => {
      setCallState('idle');
      setCallError('Call was rejected');
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        content: '❌ Call was rejected',
        senderId: 'system',
        timestamp: new Date().toISOString(),
        type: 'system'
      }]);
      endVoiceCall();
    });

    // Robust WebRTC signaling handler
    newSocket.on('voice_call_signal', async (data) => {
      // Defensive: Only handle if we have a connected user
      if (!connectedUser && !incomingCallFrom) return;

      // If peer already exists, just signal it
      if (peer) {
        try {
          peer.signal(data.signal);
        } catch (err) {
          console.error('Peer.signal error:', err);
        }
        return;
      }

      // If no peer exists, this is the callee receiving the first signal
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });
        setLocalStream(stream);

        const newPeer = new Peer({
          initiator: false,
          trickle: false,
          stream,
          config: {
            iceServers: [
              { urls: 'stun:stun.l.google.com:19302' },
              { urls: 'stun:stun1.l.google.com:19302' },
            ]
          }
        });

        newPeer.on('signal', (signalData) => {
          newSocket.emit('voice_call_signal', {
            signal: signalData,
            to: data.from
          });
        });

        newPeer.on('connect', () => {
          setCallState('connected');
          setCallStartTime(new Date());
          setIsEncrypted(true);
          setIsCallActive(true);
          // Monitor audio quality (simplified)
          const qualityInterval = setInterval(() => {
            setAudioQuality('good');
          }, 5000);
          newPeer.on('close', () => clearInterval(qualityInterval));
        });

        newPeer.on('stream', (remoteStream) => {
          const audio = new Audio();
          audio.srcObject = remoteStream;
          audio.play().catch(console.error);
        });

        newPeer.on('error', (error) => {
          console.error('Peer connection error:', error);
          setCallError(`Connection failed: ${error.message}`);
          endVoiceCall();
        });

        // Signal with the offer from initiator
        newPeer.signal(data.signal);
        setPeer(newPeer);
      } catch (error) {
        console.error('Failed to accept call:', error);
        setCallError('Microphone access denied or signaling error');
        endVoiceCall();
      }
    });

    newSocket.on('voice_call_end', () => {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        content: 'Voice call ended.',
        senderId: 'system',
        timestamp: new Date().toISOString(),
        type: 'system'
      }]);
      endVoiceCall();
    });

    setSocket(newSocket);
    return () => {
      newSocket.close();
    };
  }, [user]);

  // Accept incoming call
  const acceptCall = async () => {
    if (!socket || !incomingCallFrom) return;

    try {
      setCallError(null);
      socket.emit('voice_call_accept', { to: incomingCallFrom });

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      setLocalStream(stream);
      setIncomingCallFrom(null);
      setCallState('connecting');

    } catch (error) {
      setCallError('Microphone access denied');
      rejectCall();
    }
  };

  // Reject incoming call
  const rejectCall = () => {
    if (socket && incomingCallFrom) {
      socket.emit('voice_call_reject', { to: incomingCallFrom });
    }
    setIncomingCallFrom(null);
    setCallState('idle');
    setCallError(null);
  };

  // Handle reconnection
  const handleReconnection = async () => {
    if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
      setReconnectAttempts(prev => prev + 1);
      setCallError(`Reconnecting... (${reconnectAttempts + 1}/${MAX_RECONNECT_ATTEMPTS})`);
      try {
        await startVoiceCall();
        setReconnectAttempts(0);
      } catch (error) {
        setTimeout(handleReconnection, 2000);
      }
    } else {
      setCallError('Unable to reconnect. Please try calling again.');
      endVoiceCall();
    }
  };

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
    if (newMessage.trim() && user) {
      if (chatMode === 'bot') {
        // Chat with WhisBot
        sendMessageToBot();
      } else if (socket && isConnected) {
        // Chat with human
        sendMessageToHuman();
      } else {
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          content: 'You need to connect to the server first.',
          senderId: 'system',
          timestamp: new Date().toISOString(),
          type: 'system'
        }]);
      }
    }
  };

  const sendMessageToBot = async () => {
    if (!newMessage.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content: newMessage,
      senderId: user!.username,
      timestamp: new Date().toISOString(),
      type: 'text'
    };
    setMessages(prev => [...prev, userMessage]);

    const messageContent = newMessage;
    setNewMessage('');

    // Show bot typing
    setBotTyping(true);

    try {
      const botResponse = await whisBot.getBotResponse(messageContent);

      // Add bot message after delay
      setTimeout(() => {
        setBotTyping(false);
        const botMessage: Message = {
          id: Date.now().toString(),
          content: botResponse.message,
          senderId: 'WhisBot',
          timestamp: new Date().toISOString(),
          type: 'whisbot'
        };
        setMessages(prev => [...prev, botMessage]);
      }, 1000);
    } catch (error) {
      setBotTyping(false);
      console.error('WhisBot error:', error);
    }
  };

  const sendMessageToHuman = () => {
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
      senderId: user!.username,
      timestamp: new Date().toISOString(),
      type: 'text'
    };

    // Add message to local state immediately
    setMessages(prev => [...prev, message]);

    // Send to server
    socket!.emit('send_message', {
      content: newMessage,
      type: 'text'
    });

    setNewMessage('');
  };

  const toggleChatMode = (mode: 'human' | 'bot') => {
    setChatMode(mode);
    if (mode === 'bot') {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        content: `🤖 WhisBot is here! I'm feeling ${botVibe} today. ${whisBot.getConversationStarter()}`,
        senderId: 'WhisBot',
        timestamp: new Date().toISOString(),
        type: 'whisbot'
      }]);
      whisBot.setVibe(botVibe);
    } else {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        content: 'Switched back to human chat. Click "Find" to connect with other users.',
        senderId: 'system',
        timestamp: new Date().toISOString(),
        type: 'system'
      }]);
    }
  };

  const changeBotVibe = (vibe: 'friendly' | 'flirty' | 'intellectual' | 'funny') => {
    setBotVibe(vibe);
    whisBot.setVibe(vibe);
    if (chatMode === 'bot') {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        content: `✨ Vibe changed to ${vibe}! ${whisBot.getConversationStarter()}`,
        senderId: 'WhisBot',
        timestamp: new Date().toISOString(),
        type: 'whisbot'
      }]);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  // Enhanced voice call functions with WebRTC
  const startVoiceCall = async () => {
    if (!connectedUser || !socket) {
      setCallError('No user connected');
      return;
    }

    try {
      setCallError(null);
      setCallState('calling');
      setReconnectAttempts(0);

      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      setLocalStream(stream);

      // Create peer connection
      const newPeer = new Peer({
        initiator: true,
        trickle: false,
        stream,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
          ]
        }
      });

      newPeer.on('signal', (signalData) => {
        socket.emit('voice_call_signal', {
          signal: signalData,
          to: connectedUser
        });
      });

      newPeer.on('connect', () => {
        setCallState('connected');
        setCallStartTime(new Date());
        setIsEncrypted(true);
        setIsCallActive(true);
      });

      newPeer.on('stream', (remoteStream) => {
        // Play remote audio
        const audio = new Audio();
        audio.srcObject = remoteStream;
        audio.play().catch(console.error);
      });

      newPeer.on('error', (error) => {
        console.error('Peer error:', error);
        setCallError('Connection failed');
        if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
          handleReconnection();
        } else {
          endVoiceCall();
        }
      });

      newPeer.on('close', () => {
        endVoiceCall();
      });

      setPeer(newPeer);

      // Notify the other user
      socket.emit('voice_call_initiate', { to: connectedUser });

    } catch (error) {
      setCallError('Microphone access denied');
      setCallState('idle');
      console.error('Voice call error:', error);
    }
  };

  const endVoiceCall = () => {
    if (peer) {
      peer.destroy();
      setPeer(null);
    }

    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }

    setIsCallActive(false);
    setIsMuted(false);
    setCallError(null);
    setCallState('idle');
    setCallDuration(0);
    setCallStartTime(null);
    setAudioQuality('unknown');
    setIsEncrypted(false);
    setIncomingCallFrom(null);
    setReconnectAttempts(0);

    if (socket && connectedUser) {
      socket.emit('voice_call_end', { to: connectedUser });
    }
  };

  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
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
          {/* Chat Mode Selector */}
          <Box sx={{ mb: 2 }}>
            <Tabs
              value={chatMode}
              onChange={(_, newValue) => toggleChatMode(newValue)}
              variant="fullWidth"
              sx={{ mb: 1 }}
            >
              <Tab
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PersonIcon />
                    Human Chat
                    {connectedUser && <Chip label={connectedUser} size="small" color="success" />}
                  </Box>
                }
                value="human"
              />
              <Tab
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <BotIcon />
                    WhisBot AI
                    {botTyping && <CircularProgress size={16} />}
                  </Box>
                }
                value="bot"
              />
            </Tabs>

            {/* Bot Vibe Selector */}
            {chatMode === 'bot' && (
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
                {[
                  { vibe: 'friendly', label: 'Friendly 🧸', color: 'primary' },
                  { vibe: 'flirty', label: 'Flirty 😘', color: 'secondary' },
                  { vibe: 'intellectual', label: 'Smart 🤓', color: 'info' },
                  { vibe: 'funny', label: 'Funny 🤡', color: 'warning' }
                ].map(({ vibe, label, color }) => (
                  <Chip
                    key={vibe}
                    label={label}
                    variant={botVibe === vibe ? 'filled' : 'outlined'}
                    color={color as any}
                    size="small"
                    onClick={() => changeBotVibe(vibe as any)}
                    sx={{ cursor: 'pointer' }}
                  />
                ))}
              </Box>
            )}
          </Box>
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
                    <Avatar sx={{
                      mr: 2,
                      bgcolor: message.type === 'system' ? 'grey.500' :
                        message.type === 'whisbot' ? 'secondary.main' :
                          'primary.main'
                    }}>
                      {message.type === 'system' ? '🤖' :
                        message.type === 'whisbot' ? '✨' :
                          message.senderId === userId ? 'You' : 'User'}
                    </Avatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="subtitle2" component="span">
                            {message.type === 'system' ? 'System' :
                              message.type === 'whisbot' ? 'WhisBot' :
                                message.senderId === userId ? 'You' : 'Anonymous User'}
                          </Typography>
                          {message.type === 'whisbot' && (
                            <Chip label={botVibe} size="small" color="secondary" />
                          )}
                          <Typography variant="caption" color="text.secondary">
                            {new Date(message.timestamp).toLocaleTimeString()}
                          </Typography>
                        </Box>
                      }
                      secondary={
                        <Typography
                          variant="body1"
                          color={message.type === 'system' ? 'text.secondary' : 'text.primary'}
                          sx={{
                            mt: 0.5,
                            fontStyle: message.type === 'whisbot' ? 'italic' : 'normal'
                          }}
                        >
                          {message.content}
                        </Typography>
                      }
                    />
                  </ListItem>
                ))}

                {/* Bot typing indicator */}
                {botTyping && chatMode === 'bot' && (
                  <ListItem alignItems="flex-start">
                    <Avatar sx={{ mr: 2, bgcolor: 'secondary.main' }}>
                      ✨
                    </Avatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="subtitle2" component="span">
                            WhisBot
                          </Typography>
                          <Chip label={botVibe} size="small" color="secondary" />
                        </Box>
                      }
                      secondary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                          <CircularProgress size={16} />
                          <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                            typing...
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                )}
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
                  placeholder={
                    chatMode === 'bot'
                      ? `Chat with WhisBot (${botVibe} mode)...`
                      : "Type your message..."
                  }
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={chatMode === 'human' && !isConnected}
                  variant="outlined"
                  size="small"
                />
                <Button
                  variant="contained"
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || (chatMode === 'human' && !isConnected)}
                  sx={{ minWidth: 48, height: 40 }}
                  color={chatMode === 'bot' ? 'secondary' : 'primary'}
                >
                  {chatMode === 'bot' ? <BotIcon /> : <SendIcon />}
                </Button>
              </Box>
              {chatMode === 'human' && !isConnected && (
                <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
                  Disconnected from server. Check your connection.
                </Typography>
              )}
              {chatMode === 'bot' && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  🤖 Chatting with WhisBot AI in {botVibe} mode
                </Typography>
              )}
            </Paper>
          </Paper>

          {/* Find Button - only for human mode */}
          {chatMode === 'human' && (
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
          )}

          {/* Connection Status - only for human mode */}
          {chatMode === 'human' && connectedUser && (
            <Box sx={{ mt: 1, display: 'flex', justifyContent: 'center' }}>
              <Typography variant="body2" color="success.main">
                Connected with: {connectedUser}
              </Typography>
            </Box>
          )}

          {/* Bot status for bot mode */}
          {chatMode === 'bot' && (
            <Box sx={{ mt: 1, display: 'flex', justifyContent: 'center' }}>
              <Typography variant="body2" color="secondary.main">
                🤖 WhisBot is ready to chat in {botVibe} mode!
              </Typography>
            </Box>
          )}

          {/* Incoming Call Dialog */}
          <Dialog open={callState === 'ringing'} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ textAlign: 'center' }}>
              📞 Incoming Call
            </DialogTitle>
            <DialogContent sx={{ textAlign: 'center', py: 3 }}>
              <Typography variant="h6" gutterBottom>
                Call from {incomingCallFrom}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Would you like to accept this voice call?
              </Typography>
            </DialogContent>
            <DialogActions sx={{ justifyContent: 'center', gap: 2, pb: 3 }}>
              <Button
                onClick={acceptCall}
                color="success"
                variant="contained"
                startIcon={<CallReceived />}
                size="large"
              >
                Accept
              </Button>
              <Button
                onClick={rejectCall}
                color="error"
                variant="outlined"
                startIcon={<CallEnd />}
                size="large"
              >
                Decline
              </Button>
            </DialogActions>
          </Dialog>

          {/* Enhanced Voice Call UI - only for human mode */}
          {chatMode === 'human' && connectedUser && (
            <Box sx={{ mt: 2, p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Voice Call</Typography>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  {isEncrypted && <Lock color="success" fontSize="small" />}
                  {audioQuality === 'poor' && <SignalCellularConnectedNoInternet0Bar color="warning" fontSize="small" />}
                  {callState === 'connected' && (
                    <Typography variant="caption" color="text.secondary">
                      {formatDuration(callDuration)}
                    </Typography>
                  )}
                </Box>
              </Box>

              {callError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {callError}
                  {reconnectAttempts > 0 && reconnectAttempts < MAX_RECONNECT_ATTEMPTS && (
                    <Button size="small" onClick={handleReconnection} sx={{ ml: 1 }}>
                      Retry ({MAX_RECONNECT_ATTEMPTS - reconnectAttempts} attempts left)
                    </Button>
                  )}
                </Alert>
              )}

              {callState === 'idle' && (
                <Button
                  variant="contained"
                  startIcon={<PhoneIcon />}
                  onClick={startVoiceCall}
                  fullWidth
                  disabled={!connectedUser}
                >
                  Start Voice Call
                </Button>
              )}

              {callState === 'calling' && (
                <Box sx={{ textAlign: 'center' }}>
                  <CircularProgress sx={{ mb: 2 }} />
                  <Typography gutterBottom>Calling {connectedUser}...</Typography>
                  <Button onClick={endVoiceCall} color="error" variant="outlined">
                    Cancel
                  </Button>
                </Box>
              )}

              {callState === 'connecting' && (
                <Box sx={{ textAlign: 'center' }}>
                  <CircularProgress sx={{ mb: 2 }} />
                  <Typography>Connecting...</Typography>
                </Box>
              )}

              {callState === 'connected' && (
                <>
                  <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    <Button
                      variant="outlined"
                      startIcon={isMuted ? <MicOff /> : <Mic />}
                      onClick={toggleMute}
                      color={isMuted ? "error" : "primary"}
                    >
                      {isMuted ? 'Unmute' : 'Mute'}
                    </Button>
                    <Button
                      variant="contained"
                      color="error"
                      startIcon={<PhoneDisabled />}
                      onClick={endVoiceCall}
                      fullWidth
                    >
                      End Call
                    </Button>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" color="success.main">
                      📞 Connected with {connectedUser}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      {isEncrypted && (
                        <Typography variant="caption" color="success.main">
                          🔒 Encrypted
                        </Typography>
                      )}
                      {audioQuality === 'poor' && (
                        <Typography variant="caption" color="warning.main">
                          ⚠️ Poor Quality
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </>
              )}
            </Box>
          )}
        </Container>
      </Box>
    </ThemeProvider>
  );
}

export default App;
