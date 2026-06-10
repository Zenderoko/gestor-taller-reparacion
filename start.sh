#!/bin/bash
# Script de inicio para GestorTaller en NAS
# Ubicar en /usr/local/bin/gestor-taller o en la tarea programada del NAS

DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$DIR/backend"
FRONTEND_DIR="$DIR/frontend"
LOG_FILE="$DIR/startup.log"

echo "[$(date)] Iniciando GestorTaller..." >> "$LOG_FILE"

# 1. Construir frontend si no existe
if [ ! -f "$FRONTEND_DIR/dist/index.html" ]; then
  echo "Construyendo frontend..." >> "$LOG_FILE"
  cd "$FRONTEND_DIR" && npm install && npm run build >> "$LOG_FILE" 2>&1
fi

# 2. Iniciar backend
cd "$BACKEND_DIR"

# Verificar si ya está corriendo
PID=$(lsof -ti:3001 2>/dev/null)
if [ -n "$PID" ]; then
  echo "GestorTaller ya está corriendo (PID: $PID)" >> "$LOG_FILE"
  exit 0
fi

NODE_ENV=production nohup node src/index.js >> "$LOG_FILE" 2>&1 &
echo "GestorTaller iniciado (PID: $!)" >> "$LOG_FILE"
