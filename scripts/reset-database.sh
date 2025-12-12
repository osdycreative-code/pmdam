#!/bin/bash

# Script para restablecer la base de datos con datos reales
# Asegúrate de tener PostgreSQL instalado y corriendo localmente

# Configurar variables
DB_USER="postgres"
DB_NAME="pman_local"
DB_HOST="localhost"
DB_PORT="5432"

echo "=== REINICIANDO BASE DE DATOS CON DATOS REALES ==="

echo "Verificando si PostgreSQL está corriendo..."
if ! pg_isready -h $DB_HOST -p $DB_PORT -U $DB_USER > /dev/null 2>&1; then
    echo "ERROR: PostgreSQL no está disponible en $DB_HOST:$DB_PORT"
    echo "Por favor, asegúrate de que PostgreSQL esté instalado y corriendo."
    exit 1
fi

echo "1. Creando base de datos $DB_NAME si no existe..."
createdb -h $DB_HOST -p $DB_PORT -U $DB_USER $DB_NAME 2>/dev/null || echo "Base de datos $DB_NAME ya existe o error al crearla"

# Ejecutar script de inicialización con datos reales
echo "2. Ejecutando script de inicialización..."
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f reset_db_with_real_data.sql

echo "3. Verificando estructura y datos..."
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT table_name, table_type FROM information_schema.tables WHERE table_schema = 'public';"

echo "=== PROCESO COMPLETADO ==="
echo "La base de datos ha sido restablecida con datos reales."
echo "Puedes verificar los datos ejecutando consultas como:"
echo "psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c 'SELECT * FROM proyectos_maestros;'"