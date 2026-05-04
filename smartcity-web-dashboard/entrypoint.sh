#!/bin/sh
set -e

# Create runtime configuration file for frontend
cat > /usr/share/nginx/html/config.js << EOF
window.ENV = {
  VITE_API_URL: '/api'
};
EOF

echo "✅ Runtime config created: VITE_API_URL=/api"

# Start supervisord
exec /usr/bin/supervisord -c /etc/supervisord.conf
