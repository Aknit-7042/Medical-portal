const config = {
  apiUrl: process.env.NODE_ENV === 'production'
    ? 'https://medical-portal-0ndn.onrender.com'
    : 'http://localhost:5001'
};

export default config;
