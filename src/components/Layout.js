import React from 'react';
import { AppBar, Toolbar, Typography, Box, Container, useTheme } from '@mui/material';
import { useLocation } from 'react-router-dom';

function Layout({ children }) {
  const theme = useTheme();
  const location = useLocation();

  // Don't show header on login page
  if (location.pathname === '/login') {
    return children;
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static" sx={{ backgroundColor: theme.palette.primary.main }}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Medical Procedures Test Portal
          </Typography>
        </Toolbar>
      </AppBar>
      <Container 
        component="main" 
        sx={{ 
          flexGrow: 1,
          py: 4,
          backgroundColor: '#f5f5f5',
          minHeight: 'calc(100vh - 64px)'
        }}
      >
        {children}
      </Container>
    </Box>
  );
}

export default Layout;
