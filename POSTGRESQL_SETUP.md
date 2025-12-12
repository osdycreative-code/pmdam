# Configuración de PostgreSQL para PMDAM

Esta guía te ayudará a configurar PostgreSQL para que funcione con el proyecto PMDAM.

## 1. Instalación de PostgreSQL

### Ubuntu/Debian:
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
```

### CentOS/RHEL/Fedora:
```bash
sudo dnf install postgresql-server postgresql-contrib
sudo postgresql-setup --initdb
```

### macOS (con Homebrew):
```bash
brew install postgresql
```

### Windows:
Descarga el instalador desde [https://www.postgresql.org/download/windows/](https://www.postgresql.org/download/windows/)

## 2. Iniciar el servicio de PostgreSQL

### Linux:
```bash
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### macOS:
```bash
brew services start postgresql
```

### Windows:
El servicio se inicia automáticamente después de la instalación.

## 3. Configurar el usuario postgres

### Linux/macOS:
```bash
sudo -u postgres psql postgres
```

Dentro de la consola de PostgreSQL, establece una contraseña para el usuario postgres:
```sql
\password postgres
```

Luego sal de la consola:
```sql
\q
```

### Windows:
Durante la instalación, se te pedirá que establezcas una contraseña para el usuario postgres.

## 4. Verificar la instalación

```bash
pg_isready
```

Si todo está bien configurado, deberías ver un mensaje como:
```
/var/run/postgresql:5432 - aceptando conexiones
```

## 5. Configurar autenticación (si es necesario)

Si encuentras problemas de autenticación, edita el archivo `pg_hba.conf`:

### Ubicación típica del archivo:
- Linux: `/etc/postgresql/[versión]/main/pg_hba.conf`
- macOS: `/usr/local/var/postgres/pg_hba.conf`
- Windows: `C:\Program Files\PostgreSQL\[versión]\data\pg_hba.conf`

### Cambiar la línea:
```
local   all             postgres                                peer
```

Por:
```
local   all             postgres                                md5
```

Luego reinicia PostgreSQL:
```bash
sudo systemctl restart postgresql
```

## 6. Probar la conexión

```bash
psql -U postgres -h localhost -p 5432 -d postgres
```

Cuando se te solicite, ingresa la contraseña que estableciste para el usuario postgres.

## 7. Crear la base de datos para PMDAM

Dentro de la consola de PostgreSQL:
```sql
CREATE DATABASE pman_local;
```

## 8. Ejecutar el script de restablecimiento

Ahora puedes ejecutar el script de restablecimiento de la base de datos:

```bash
cd /ruta/a/tu/proyecto/pmdam
./scripts/reset-database.sh
```

## Problemas comunes y soluciones

### 1. "Peer authentication failed"
Solución: Editar `pg_hba.conf` como se describe en el paso 5.

### 2. "Connection refused"
Solución: Asegúrate de que PostgreSQL esté corriendo y escuchando en el puerto 5432.

### 3. "Database does not exist"
Solución: Crea la base de datos manualmente como se describe en el paso 7.

### 4. Permisos insuficientes
Solución: Asegúrate de ejecutar los comandos con suficientes privilegios (sudo en Linux/macOS si es necesario).