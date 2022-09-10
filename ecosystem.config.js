module.exports = {
  apps: [
    {
      name: 'gour-payment-service',
      script: 'dist/main.js',
      instances: 1,
      restart_delay: 100,
      autorestart: true,
      watch: false,
      max_memory_restart: '300M',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};

