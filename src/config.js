const config = {
  apiUrl: process.env.NODE_ENV === 'production'
    ? 'https://medical-portal-0ndn.onrender.com'
    : 'http://192.168.1.72:5001'
};

export default config;
