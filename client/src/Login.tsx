import React, { useState } from 'react';
import {
    Box,
    Button,
    Container,
    CssBaseline,
    Paper,
    TextField,
    Typography,
    Radio,
    RadioGroup,
    FormControlLabel,
    FormControl,
    FormLabel,
} from '@mui/material';

interface SignUpProps {
    onSignUp: (data: { email: string; password: string; username: string; gender: string }) => void;
}


const SignUp: React.FC<SignUpProps> = ({ onSignUp }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [gender, setGender] = useState('male');
    // OTP logic removed
    const [error, setError] = useState<string | null>(null);


    // Register user with backend API
    // (OTP logic removed, always register directly)

    // Register user with backend API
    const registerUser = async () => {
        try {
            const response = await fetch('http://localhost:3001/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email,
                    password,
                    username,
                    gender
                }),
            });

            const data = await response.json();

            if (response.ok) {
                // Store token in localStorage
                localStorage.setItem('authToken', data.token);
                localStorage.setItem('currentUser', JSON.stringify(data.user));

                onSignUp({ email, password, username, gender });
            } else {
                setError(data.error || 'Registration failed');
            }
        } catch (error) {
            setError('Network error. Please try again.');
            console.error('Registration error:', error);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        registerUser();
    };

    return (
        <Container maxWidth="xs">
            <CssBaseline />
            <Box sx={{ mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
                    <Typography component="h1" variant="h5" align="center" gutterBottom>
                        Sign Up
                    </Typography>
                    <Box component="form" onSubmit={handleSubmit}>
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            label="Gmail"
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            autoFocus
                        />
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            label="Username"
                            value={username}
                            onChange={e => setUsername(e.target.value)}
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
                        <FormControl component="fieldset" sx={{ mt: 2 }}>
                            <FormLabel component="legend">Gender</FormLabel>
                            <RadioGroup
                                row
                                value={gender}
                                onChange={e => setGender(e.target.value)}
                            >
                                <FormControlLabel value="male" control={<Radio />} label="Male" />
                                <FormControlLabel value="female" control={<Radio />} label="Female" />
                            </RadioGroup>
                        </FormControl>
                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            sx={{ mt: 3, mb: 2 }}
                        >
                            Sign Up
                        </Button>
                    </Box>
                    {error && (
                        <Typography color="error" align="center" sx={{ mt: 2 }}>
                            {error}
                        </Typography>
                    )}
                </Paper>
            </Box>
        </Container>
    );
};

export default SignUp;
