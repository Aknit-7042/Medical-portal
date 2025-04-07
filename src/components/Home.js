import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Button,
  Typography,
  Box,
  Grid,
  Paper,
} from '@mui/material';

function Home() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const menuItems = [
    {
      title: 'Start Test',
      description: 'Begin a new medical procedures test',
      action: () => navigate('/test'),
      color: '#3498db',
      icon: '📝',
    },
    {
      title: 'View Results',
      description: 'Check your previous test scores',
      action: () => navigate('/results'),
      color: '#2ecc71',
      icon: '📊',
    },
    {
      title: 'Logout',
      description: 'Sign out from your account',
      action: handleLogout,
      color: '#e74c3c',
      icon: '🚪',
    },
  ];

  return (
    <Container maxWidth="md">
      <Box
        sx={{
          mt: 4,
          mb: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Typography
          variant="h4"
          component="h1"
          gutterBottom
          sx={{
            fontWeight: 700,
            color: '#2c3e50',
            textAlign: 'center',
            mb: 4,
          }}
        >
          Welcome to Medical Procedures
          <br />
          Test Portal
        </Typography>

        <Grid container spacing={3}>
          {menuItems.map((item, index) => (
            <Grid item xs={12} md={4} key={index}>
              <Paper
                sx={{
                  p: 3,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  cursor: 'pointer',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
                  },
                }}
                onClick={item.action}
              >
                <Typography
                  variant="h1"
                  sx={{
                    fontSize: '3rem',
                    mb: 2,
                  }}
                >
                  {item.icon}
                </Typography>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 600,
                    color: item.color,
                    mb: 1,
                  }}
                >
                  {item.title}
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    color: '#666',
                  }}
                >
                  {item.description}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Container>
  );
}

export default Home;
