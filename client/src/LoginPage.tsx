import React, { useState } from 'react';
import {
    Box,
    Button,
    Container,
    CssBaseline,
    Paper,
    TextField,
    Typography
} from '@mui/material';

interface LoginProps {
    onLogin: (data: { identifier: string; password: string }) => void;
    onForgotPassword?: (email: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin, onForgotPassword }) => {
    const [identifier, setIdentifier] = useState(''); // username or gmail
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [forgotEmail, setForgotEmail] = useState('');
    const [forgotMessage, setForgotMessage] = useState<string | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (!identifier || !password) {
            setError('Please enter your username or Gmail and password.');
            return;
        }
        loginUser();
    };

    // Login user with backend API
    const loginUser = async () => {
        try {
            const response = await fetch('http://localhost:3001/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    identifier,
                    password
                }),
            });

            const data = await response.json();

            if (response.ok) {
                // Store token in localStorage
                localStorage.setItem('authToken', data.token);
                localStorage.setItem('currentUser', JSON.stringify(data.user));

                onLogin({ identifier, password });
            } else {
                setError(data.error || 'Login failed');
            }
        } catch (error) {
            setError('Network error. Please try again.');
            console.error('Login error:', error);
        }
    };

    const handleForgotPassword = (e: React.FormEvent) => {
        e.preventDefault();
        if (!forgotEmail) {
            setForgotMessage('Please enter your email address.');
            return;
        }
        if (onForgotPassword) {
            onForgotPassword(forgotEmail);
            setForgotMessage('Password reset instructions sent to your email (Demo mode).');
        }
    };

    return (
        <Container maxWidth="xs">
            <CssBaseline />
            <Box sx={{ mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
                    <Typography component="h1" variant="h5" align="center" gutterBottom>
                        {showForgotPassword ? 'Forgot Password' : 'Login'}
                    </Typography>
                    {!showForgotPassword ? (
                        <Box component="form" onSubmit={handleSubmit}>
                            <TextField
                                margin="normal"
                                required
                                fullWidth
                                label="Username or Gmail"
                                value={identifier}
                                onChange={e => setIdentifier(e.target.value)}
                                autoFocus
                            />
                            <TextField
                                margin="normal"
                                required
                                fullWidth
                                label="Password"
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                            />
                            <Button
                                type="submit"
                                fullWidth
                                variant="contained"
                                sx={{ mt: 3, mb: 2 }}
                            >
                                Login
                            </Button>
                            <Box sx={{ textAlign: 'center' }}>
                                <Button
                                    size="small"
                                    onClick={() => setShowForgotPassword(true)}
                                >
                                    Forgot Password?
                                </Button>
                            </Box>
                            {error && (
                                <Typography color="error" align="center" sx={{ mt: 2 }}>
                                    {error}
                                </Typography>
                            )}
                        </Box>
                    ) : (
                        <Box component="form" onSubmit={handleForgotPassword}>
                            <TextField
                                margin="normal"
                                required
                                fullWidth
                                label="Email Address"
                                type="email"
                                value={forgotEmail}
                                onChange={e => setForgotEmail(e.target.value)}
                                autoFocus
                            />
                            <Button
                                type="submit"
                                fullWidth
                                variant="contained"
                                sx={{ mt: 3, mb: 2 }}
                            >
                                Send Reset Instructions
                            </Button>
                            <Box sx={{ textAlign: 'center' }}>
                                <Button
                                    size="small"
                                    onClick={() => {
                                        setShowForgotPassword(false);
                                        setForgotMessage(null);
                                        setForgotEmail('');
                                    }}
                                >
                                    Back to Login
                                </Button>
                            </Box>
                            {forgotMessage && (
                                <Typography color="success.main" align="center" sx={{ mt: 2 }}>
                                    {forgotMessage}
                                </Typography>
                            )}
                        </Box>
                    )}
                </Paper>
            </Box>
        </Container>
    );
};

export default Login;
