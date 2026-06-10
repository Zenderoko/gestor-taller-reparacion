module.exports = {
  apps: [{
    name: 'gestor-taller-backend',
    script: 'src/index.js',
    cwd: './backend',
    env: {
      NODE_ENV: 'production',
      PORT: 3001,
    },
    env_file: './backend/.env',
    instances: 1,
    exec_mode: 'fork',
    watch: false,
    max_memory_restart: '500M',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    error_file: './logs/error.log',
    out_file: './logs/out.log',
    merge_logs: true,
    autorestart: true,
  }],
};
