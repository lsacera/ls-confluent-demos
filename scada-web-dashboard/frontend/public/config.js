// Runtime configuration
// This file is overwritten in production by docker-entrypoint.sh
window.ENV = window.ENV || {
  VITE_API_URL: 'http://localhost:3000/api'
};
