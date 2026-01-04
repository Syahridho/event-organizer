# Event Organizer Platform

Platform digital terintegrasi untuk Event Organizer, peserta acara, penyedia venue dan vendor.

## 🚀 Features

- **Event Management**: Kelola event dengan sistem tiket terintegrasi
- **Service Marketplace**: Platform untuk vendor jasa event profesional
- **Venue Booking**: Sistem booking gedung dan tempat acara
- **Property Rental**: Sewa perlengkapan acara
- **Payment Integration**: Midtrans payment gateway
- **Real-time Chat**: Komunikasi antara mitra dan customer
- **Review & Rating**: Sistem review dan rating untuk mitra
- **Admin Dashboard**: Dashboard lengkap untuk monitoring

## 📋 Requirements

- PHP >= 8.1
- Composer
- Node.js >= 18.x
- MySQL >= 8.0
- Redis (optional, for queue)

## 🛠️ Installation

### 1. Clone Repository

```bash
git clone https://github.com/YOUR_USERNAME/event-organizer.git
cd event-organizer
```

### 2. Install Dependencies

```bash
# Install PHP dependencies
composer install

# Install Node dependencies
npm install
```

### 3. Environment Setup

```bash
# Copy environment file
cp .env.example .env

# Generate application key
php artisan key:generate
```

### 4. Database Configuration

Edit `.env` file:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=event_organizer
DB_USERNAME=root
DB_PASSWORD=
```

### 5. Run Migrations & Seeders

```bash
# Run migrations
php artisan migrate

# Run seeders (creates admin, demo data)
php artisan db:seed
```

### 6. Storage Setup

```bash
# Create storage link
php artisan storage:link

# Set permissions (Linux/Mac)
chmod -R 775 storage bootstrap/cache
```

### 7. Build Assets

```bash
# Development
npm run dev

# Production
npm run build
```

### 8. Run Application

```bash
# Development server
php artisan serve

# Queue worker (optional)
php artisan queue:work
```

## 🔐 Default Credentials

After seeding, you can login with:

**Admin:**
- Email: `admin@eventnusa.com`
- Password: `password`

**Mitra:**
- Email: `mitra@eventnusa.com`
- Password: `password`

**User:**
- Email: `user@eventnusa.com`
- Password: `password`

## 📁 Project Structure

```
event-organizer/
├── app/
│   ├── Http/Controllers/
│   ├── Models/
│   └── Helpers/
├── database/
│   ├── migrations/
│   ├── seeders/
│   └── factories/
├── resources/
│   ├── js/
│   │   ├── Components/
│   │   ├── Pages/
│   │   └── Layouts/
│   └── css/
├── routes/
│   └── web.php
└── public/
```

## 🌐 Deployment to VPS

### 1. Server Requirements

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install PHP 8.1
sudo apt install php8.1-fpm php8.1-mysql php8.1-mbstring php8.1-xml php8.1-curl php8.1-zip php8.1-gd php8.1-redis -y

# Install Composer
curl -sS https://getcomposer.org/installer | php
sudo mv composer.phar /usr/local/bin/composer

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install nodejs -y

# Install MySQL
sudo apt install mysql-server -y

# Install Nginx
sudo apt install nginx -y
```

### 2. Clone & Setup

```bash
cd /var/www
sudo git clone https://github.com/YOUR_USERNAME/event-organizer.git
cd event-organizer

# Set ownership
sudo chown -R www-data:www-data /var/www/event-organizer
sudo chmod -R 775 storage bootstrap/cache

# Install dependencies
composer install --optimize-autoloader --no-dev
npm install
npm run build
```

### 3. Environment Configuration

```bash
cp .env.example .env
php artisan key:generate

# Edit .env for production
nano .env
```

Production `.env` settings:
```env
APP_ENV=production
APP_DEBUG=false
APP_URL=https://yourdomain.com

DB_CONNECTION=mysql
DB_HOST=localhost
DB_PORT=3306
DB_DATABASE=event_organizer_prod
DB_USERNAME=your_db_user
DB_PASSWORD=your_secure_password

# Midtrans (Production)
MIDTRANS_SERVER_KEY=your_production_server_key
MIDTRANS_CLIENT_KEY=your_production_client_key
MIDTRANS_IS_PRODUCTION=true
```

### 4. Database Setup

```bash
# Create database
mysql -u root -p
CREATE DATABASE event_organizer_prod;
CREATE USER 'event_user'@'localhost' IDENTIFIED BY 'secure_password';
GRANT ALL PRIVILEGES ON event_organizer_prod.* TO 'event_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;

# Run migrations
php artisan migrate --force
php artisan db:seed --force
php artisan storage:link
```

### 5. Nginx Configuration

Create `/etc/nginx/sites-available/event-organizer`:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    root /var/www/event-organizer/public;

    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";

    index index.php;

    charset utf-8;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location = /favicon.ico { access_log off; log_not_found off; }
    location = /robots.txt  { access_log off; log_not_found off; }

    error_page 404 /index.php;

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.1-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/event-organizer /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 6. SSL Certificate (Let's Encrypt)

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

### 7. Setup Supervisor for Queue

Create `/etc/supervisor/conf.d/event-organizer-worker.conf`:

```ini
[program:event-organizer-worker]
process_name=%(program_name)s_%(process_num)02d
command=php /var/www/event-organizer/artisan queue:work --sleep=3 --tries=3 --max-time=3600
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true
user=www-data
numprocs=2
redirect_stderr=true
stdout_logfile=/var/www/event-organizer/storage/logs/worker.log
stopwaitsecs=3600
```

Start supervisor:
```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start event-organizer-worker:*
```

## 🔧 Configuration

### Midtrans Payment

1. Register at [Midtrans](https://midtrans.com)
2. Get Server Key and Client Key
3. Update `.env`:
```env
MIDTRANS_SERVER_KEY=your_server_key
MIDTRANS_CLIENT_KEY=your_client_key
MIDTRANS_IS_PRODUCTION=false
```

### RajaOngkir API

1. Register at [RajaOngkir](https://rajaongkir.com)
2. Get API Key
3. Update `.env`:
```env
RAJAONGKIR_API_KEY=your_api_key
```

## 📝 Important Notes

### Storage Structure

Ensure these directories exist with proper permissions:
```
storage/app/public/
├── thumbnails/
├── speakers/
├── seo/
└── default-event-images/
    └── dubby.webp
```

### Cron Jobs

Add to crontab for scheduled tasks:
```bash
* * * * * cd /var/www/event-organizer && php artisan schedule:run >> /dev/null 2>&1
```

## 📚 Deployment Documentation

### Quick Links

- **[📖 Full Deployment Guide](DEPLOYMENT.md)** - Comprehensive deployment documentation
- **[🚨 Quick Fix Guide](QUICK_FIX.md)** - Fix Vite manifest error
- **[✅ Deployment Checklist](DEPLOYMENT_CHECKLIST.md)** - Step-by-step checklist
- **[🔧 Nginx Configuration](nginx.conf.example)** - Production Nginx config
- **[⚙️ Queue Worker Service](queue-worker.service.example)** - Systemd service
- **[🌍 Production Environment](.env.production.example)** - Production .env template

### ⚠️ Important: Vite Manifest Error Fix

If you encounter **"Unable to locate file in Vite manifest: resources/js/Pages/Welcome.jsx"** error in production:

**Quick Fix:**

1. Update `resources/views/app.blade.php` line 31:
   ```blade
   <!-- Before (causes error) -->
   @vite(['resources/js/app.jsx', "resources/js/Pages/{$page['component']}.jsx"])
   
   <!-- After (fixed) -->
   @vite(['resources/js/app.jsx'])
   ```

2. Rebuild assets:
   ```bash
   npm run build
   ```

3. Upload to server and clear cache:
   ```bash
   php artisan optimize:clear
   php artisan config:cache
   sudo systemctl restart php8.2-fpm nginx
   ```

**Why this fixes the error:**
- Vite only builds `app.jsx` as entry point (defined in `vite.config.js`)
- Page components are loaded automatically via Inertia.js code splitting
- More efficient with lazy loading and smaller initial bundle size

For detailed explanation, see [QUICK_FIX.md](QUICK_FIX.md)

### 🚀 Automated Deployment

Use the deployment script for automated deployment:

```bash
# Upload script to server
scp deploy.sh user@server:/var/www/event-organizer/

# SSH to server and run
cd /var/www/event-organizer
chmod +x deploy.sh
./deploy.sh

# Options:
# ./deploy.sh --skip-build     # Skip npm build
# ./deploy.sh --skip-migrate   # Skip migrations
```

### 📋 Pre-Deployment Checklist

Before deploying to production:

- [ ] Fix applied: `app.blade.php` updated
- [ ] Assets built: `npm run build` successful
- [ ] Manifest exists: `public/build/manifest.json`
- [ ] Environment: `APP_ENV=production`, `APP_DEBUG=false`
- [ ] Database: Credentials configured
- [ ] Midtrans: Production keys set
- [ ] Mail: SMTP configured
- [ ] SSL: Certificate installed
- [ ] Permissions: `storage/` and `bootstrap/cache/` writable
- [ ] Backup: Database and files backed up

See [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md) for complete checklist.

## 🐛 Troubleshooting

### Permission Issues
```bash
sudo chown -R www-data:www-data /var/www/event-organizer
sudo chmod -R 775 storage bootstrap/cache
```

### Clear Cache
```bash
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear
```

### Optimize for Production
```bash
php artisan config:cache
php artisan route:cache
php artisan view:cache
composer dump-autoload --optimize
```

## 📄 License

This project is private and proprietary.

## 👥 Support

For support, email support@eventnusa.com

---

Made with ❤️ by Eventnusa Team
