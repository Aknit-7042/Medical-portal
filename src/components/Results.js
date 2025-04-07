import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  CircularProgress,
  Grid,
  Alert,
} from '@mui/material';

function Results() {
  const navigate = useNavigate();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/results', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setResults(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching results:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography
          variant="h4"
          component="h1"
          sx={{
            fontWeight: 700,
            color: '#2c3e50',
            textAlign: 'center',
            mb: 4,
          }}
        >
          Your Test History
        </Typography>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <CircularProgress size={40} thickness={4} />
          </Box>
        ) : error ? (
          <Alert 
            severity="error"
            sx={{
              borderRadius: 2,
              fontSize: '1rem',
            }}
          >
            {error}
          </Alert>
        ) : results.length === 0 ? (
          <Paper
            sx={{
              p: 4,
              textAlign: 'center',
              borderRadius: 2,
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
            }}
          >
            <Typography
              variant="h6"
              sx={{
                color: '#7f8c8d',
                fontWeight: 500,
              }}
            >
              No test results found. Take a test to see your results here!
            </Typography>
            <Button
              variant="contained"
              onClick={() => navigate('/test')}
              sx={{ mt: 2 }}
            >
              Take a Test
            </Button>
          </Paper>
        ) : (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Paper
                sx={{
                  p: 3,
                  borderRadius: 2,
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                }}
              >
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell
                          sx={{
                            fontWeight: 600,
                            color: '#2c3e50',
                            fontSize: '1rem',
                          }}
                        >
                          Date
                        </TableCell>
                        <TableCell
                          sx={{
                            fontWeight: 600,
                            color: '#2c3e50',
                            fontSize: '1rem',
                          }}
                        >
                          Score
                        </TableCell>
                        <TableCell
                          sx={{
                            fontWeight: 600,
                            color: '#2c3e50',
                            fontSize: '1rem',
                          }}
                        >
                          Percentage
                        </TableCell>
                        <TableCell
                          sx={{
                            fontWeight: 600,
                            color: '#2c3e50',
                            fontSize: '1rem',
                          }}
                        >
                          Topics
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {results.map((result) => (
                        <TableRow
                          key={result.id}
                          sx={{
                            '&:hover': {
                              backgroundColor: 'rgba(52, 152, 219, 0.05)',
                            },
                          }}
                        >
                          <TableCell>
                            <Typography sx={{ color: '#2c3e50' }}>
                              {new Date(result.date).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography
                              sx={{
                                fontWeight: 500,
                                color: '#2c3e50',
                              }}
                            >
                              {result.score} / {result.totalQuestions}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Box
                              sx={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                px: 2,
                                py: 0.5,
                                borderRadius: 4,
                                backgroundColor:
                                  (result.score / result.totalQuestions) * 100 >= 70
                                    ? '#2ecc71'
                                    : (result.score / result.totalQuestions) * 100 >= 50
                                    ? '#f1c40f'
                                    : '#e74c3c',
                                color: 'white',
                                fontWeight: 500,
                              }}
                            >
                              {((result.score / result.totalQuestions) * 100).toFixed(1)}%
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography
                              sx={{
                                color: '#34495e',
                                maxWidth: 300,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {result.topics}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Grid>
            <Grid item xs={12} sx={{ textAlign: 'center' }}>
              <Button
                variant="contained"
                onClick={() => navigate('/test')}
                sx={{
                  px: 4,
                  py: 1.5,
                  borderRadius: 2,
                  fontSize: '1.1rem',
                }}
              >
                Take Another Test
              </Button>
            </Grid>
          </Grid>
        )}

        <Box sx={{ mt: 3 }}>
          <Button
            variant="outlined"
            onClick={() => navigate('/')}
          >
            Back to Home
          </Button>
        </Box>
      </Box>
    </Container>
  );
}

export default Results;
