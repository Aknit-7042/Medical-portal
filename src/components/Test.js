import React, { useState, useEffect } from 'react';
import config from '../config';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Paper,
  FormControlLabel,
  Checkbox,
  Button,
  FormControl,
  RadioGroup,
  Radio,
  Grid,
  CircularProgress,
  Alert,
} from '@mui/material';

function Test() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [selectedChapters, setSelectedChapters] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [testStarted, setTestStarted] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(null);
  const [userAnswers, setUserAnswers] = useState({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  useEffect(() => {
    fetchChapters();
  }, []);

  const fetchChapters = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${config.apiUrl}/api/chapters`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch chapters');
      }

      const data = await response.json();
      setChapters(data);
    } catch (error) {
      console.error('Error fetching chapters:', error);
      setError('Failed to fetch chapters. Please try again.');
    }
    setLoading(false);
  };

  const handleChapterToggle = (chapterId) => {
    setSelectedChapters((prev) =>
      prev.includes(chapterId)
        ? prev.filter((id) => id !== chapterId)
        : [...prev, chapterId]
    );
  };

  const handleSelectAll = () => {
    if (selectedChapters.length === chapters.length) {
      setSelectedChapters([]);
    } else {
      setSelectedChapters(chapters.map(chapter => chapter.id));
    }
  };

  const handleStartTest = async () => {
    if (selectedChapters.length === 0) {
      setError('Please select at least one chapter');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${config.apiUrl}/api/questions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ chapterIds: selectedChapters }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch questions');
      }

      const data = await response.json();
      if (!data || data.length === 0) {
        throw new Error('No questions found for selected chapters');
      }

      setQuestions(data);
      setTestStarted(true);
      setCurrentQuestionIndex(0);
      setUserAnswers({});
      setError(null);
    } catch (error) {
      console.error('Error fetching questions:', error);
      setError(error.message || 'Failed to fetch questions. Please try again.');
      setTestStarted(false);
    }
    setLoading(false);
  };

  const handleAnswerSelect = (questionIndex, answer) => {
    setUserAnswers((prev) => ({
      ...prev,
      [questionIndex]: answer,
    }));
  };

  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const handleSubmitTest = async () => {
    setLoading(true);
    try {
      const submissionData = {
        answers: Object.entries(userAnswers).map(([index, answer]) => ({
          questionId: questions[parseInt(index)].id,
          answer,
        })),
      };

      const response = await fetch(`${config.apiUrl}/api/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(submissionData),
      });

      if (!response.ok) {
        throw new Error('Failed to submit test');
      }

      const data = await response.json();
      setScore(data);
      setSubmitted(true);
    } catch (error) {
      console.error('Error submitting test:', error);
      setError('Failed to submit test. Please try again.');
    }
    setLoading(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  if (loading) {
    return (
      <Container maxWidth="md">
        <Box sx={{ mt: 4, mb: 4, display: 'flex', justifyContent: 'center' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (submitted) {
    return (
      <Container maxWidth="md">
        <Box sx={{ mt: 4, mb: 4 }}>
          <Box sx={{ mt: 4 }}>
            <Paper
              elevation={3}
              sx={{
                p: 4,
                textAlign: 'center',
                borderRadius: 2,
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
              }}
            >
              <Typography
                variant="h5"
                sx={{ color: '#2c3e50', mb: 3, fontWeight: 600 }}
              >
                Test Results
              </Typography>
              
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: 4,
                  mb: 4,
                }}
              >
                <Box
                  sx={{
                    textAlign: 'center',
                    p: 2,
                    borderRadius: 2,
                    backgroundColor: 'rgba(52, 152, 219, 0.1)',
                  }}
                >
                  <Typography variant="h6" sx={{ color: '#2c3e50' }}>
                    Score
                  </Typography>
                  <Typography
                    variant="h4"
                    sx={{ color: '#2980b9', fontWeight: 600 }}
                  >
                    {score.score} / {score.total}
                  </Typography>
                </Box>

                <Box
                  sx={{
                    textAlign: 'center',
                    p: 2,
                    borderRadius: 2,
                    backgroundColor: 'rgba(46, 204, 113, 0.1)',
                  }}
                >
                  <Typography variant="h6" sx={{ color: '#2c3e50' }}>
                    Percentage
                  </Typography>
                  <Typography
                    variant="h4"
                    sx={{
                      color: score.percentage >= 70
                        ? '#27ae60'
                        : score.percentage >= 50
                        ? '#f1c40f'
                        : '#e74c3c',
                      fontWeight: 600,
                    }}
                  >
                    {score.percentage.toFixed(1)}%
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ mt: 4 }}>
                <Button
                  variant="contained"
                  onClick={() => navigate('/results')}
                  sx={{
                    mr: 2,
                    px: 3,
                    py: 1,
                    borderRadius: 2,
                    backgroundColor: '#3498db',
                  }}
                >
                  View All Results
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => {
                    setTestStarted(false);
                    setSubmitted(false);
                    setScore(null);
                    setQuestions([]);
                    setUserAnswers({});
                    setCurrentQuestionIndex(0);
                  }}
                  sx={{
                    px: 3,
                    py: 1,
                    borderRadius: 2,
                  }}
                >
                  Take Another Test
                </Button>
              </Box>
            </Paper>
          </Box>
        </Box>
      </Container>
    );
  }

  if (testStarted) {
    return (
      <Container maxWidth="md">
        <Box sx={{ mt: 4, mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
            <Typography variant="h4" component="h1">
              Medical Test
            </Typography>
            <Button
              variant="outlined"
              color="primary"
              onClick={handleLogout}
              sx={{ ml: 2 }}
            >
              Logout
            </Button>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <CircularProgress />
            </Box>
          ) : questions.length > 0 ? (
            <>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5">
                  Question {currentQuestionIndex + 1} of {questions.length}
                </Typography>
                <Typography variant="subtitle1" sx={{ color: '#666' }}>
                  {Math.round((Object.keys(userAnswers).length / questions.length) * 100)}% Complete
                </Typography>
              </Box>

              <Paper 
                elevation={3}
                sx={{ 
                  p: 4,
                  mb: 3,
                  borderRadius: 2,
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                }}
              >
                <Typography 
                  variant="h6" 
                  gutterBottom
                  sx={{ 
                    color: '#2c3e50',
                    fontWeight: 500,
                    mb: 3
                  }}
                >
                  {questions[currentQuestionIndex]?.question}
                </Typography>

                <FormControl component="fieldset" sx={{ width: '100%' }}>
                  <RadioGroup
                    value={userAnswers[currentQuestionIndex] || ''}
                    onChange={(e) =>
                      handleAnswerSelect(currentQuestionIndex, e.target.value)
                    }
                  >
                    <Grid container spacing={2}>
                      {questions[currentQuestionIndex]?.options
                        .split(',').map((option, index) => (
                          <Grid item xs={12} key={index}>
                            <Paper
                              elevation={1}
                              sx={{
                                p: 2,
                                borderRadius: 2,
                                border: '1px solid #e0e0e0',
                                '&:hover': {
                                  backgroundColor: 'rgba(52, 152, 219, 0.05)',
                                },
                                backgroundColor:
                                  userAnswers[currentQuestionIndex] === option.trim()
                                    ? 'rgba(52, 152, 219, 0.1)'
                                    : 'white',
                              }}
                            >
                              <FormControlLabel
                                value={option.trim()}
                                control={<Radio />}
                                label={option.trim()}
                                sx={{ 
                                  margin: 0,
                                  width: '100%',
                                  '& .MuiFormControlLabel-label': {
                                    color: '#2c3e50',
                                    fontSize: '1rem',
                                  }
                                }}
                              />
                            </Paper>
                          </Grid>
                        ))}
                    </Grid>
                  </RadioGroup>
                </FormControl>
              </Paper>

              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  mt: 4,
                }}
              >
                <Button
                  variant="outlined"
                  onClick={handlePrevQuestion}
                  disabled={currentQuestionIndex === 0}
                  sx={{
                    px: 4,
                    py: 1,
                    borderRadius: 2,
                  }}
                >
                  Previous
                </Button>

                {currentQuestionIndex === questions.length - 1 ? (
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleSubmitTest}
                    sx={{
                      px: 4,
                      py: 1,
                      borderRadius: 2,
                      backgroundColor: '#27ae60',
                      '&:hover': {
                        backgroundColor: '#219a52',
                      },
                    }}
                  >
                    Submit Test
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    onClick={handleNextQuestion}
                    disabled={currentQuestionIndex === questions.length - 1}
                    sx={{
                      px: 4,
                      py: 1,
                      borderRadius: 2,
                    }}
                  >
                    Next
                  </Button>
                )}
              </Box>
            </>
          ) : (
            <Alert severity="warning">
              No questions found for the selected chapters. Please try selecting different chapters.
            </Alert>
          )}
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h4" component="h1">
            Medical Test
          </Typography>
          <Button
            variant="outlined"
            color="primary"
            onClick={handleLogout}
            sx={{ ml: 2 }}
          >
            Logout
          </Button>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        ) : (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom>
              Select Chapters for Test
            </Typography>

            <Paper
              elevation={3}
              sx={{
                p: 3,
                borderRadius: 2,
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
              }}
            >
              <Grid container spacing={2}>
                {chapters.map((chapter) => (
                  <Grid item xs={12} sm={6} md={4} key={chapter.id}>
                    <Paper
                      elevation={1}
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        border: '1px solid #e0e0e0',
                        backgroundColor: selectedChapters.includes(chapter.id)
                          ? 'rgba(52, 152, 219, 0.1)'
                          : 'white',
                        '&:hover': {
                          backgroundColor: 'rgba(52, 152, 219, 0.05)',
                        },
                      }}
                    >
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={selectedChapters.includes(chapter.id)}
                            onChange={() => handleChapterToggle(chapter.id)}
                          />
                        }
                        label={chapter.name}
                        sx={{
                          margin: 0,
                          width: '100%',
                          '& .MuiFormControlLabel-label': {
                            color: '#2c3e50',
                            fontSize: '1rem',
                          },
                        }}
                      />
                    </Paper>
                  </Grid>
                ))}
              </Grid>

              <Box sx={{ mt: 3, textAlign: 'center' }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleStartTest}
                  disabled={selectedChapters.length === 0}
                  sx={{
                    px: 4,
                    py: 1.5,
                    borderRadius: 2,
                    fontSize: '1.1rem',
                    backgroundColor: '#3498db',
                    '&:hover': {
                      backgroundColor: '#2980b9',
                    },
                  }}
                >
                  Start Test
                </Button>
              </Box>
            </Paper>
          </Box>
        )}
      </Box>
    </Container>
  );
}

export default Test;
