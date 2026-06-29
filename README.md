# PMS APN

PMS APN adalah aplikasi Project Management System berbasis Laravel dan Inertia React untuk mengelola project, division, team, task, KPI, approval task, attachment, serta visualisasi workflow seperti dashboard, flow activity, dan Gantt chart.

## Tech Stack

### Backend

- PHP `^8.3`
- Laravel `^13.7`
- Inertia Laravel `^3.0`
- Laravel Fortify untuk authentication backend
- Laravel Wayfinder untuk typed route/action dari Laravel ke React
- Spatie Laravel Permission untuk role dan permission
- Laravel Passkeys dan Fortify security features
- Database default: PostgreSQL (`pgsql`)
- Cache default: Redis
- Queue dan session default: database driver

### Frontend

- React `^19.2`
- Inertia React `^3.0`
- TypeScript `^5.7`
- Vite `^8.0`
- Tailwind CSS `^4`
- Radix UI primitives
- Lucide React icons
- Sonner toast notification
- XYFlow untuk flow activity
- Shadcn-style UI components

### Tooling

- Composer
- npm
- Laravel Pint
- ESLint
- Prettier
- PHPUnit
- TypeScript compiler

## Struktur Project

```text
app/
  Http/Controllers/      Controller Inertia dan action CRUD
  Http/Requests/         Form Request validation dan authorization
  Models/                Eloquent model utama
  Services/              Business logic CRUD dan workflow
database/
  migrations/            Struktur database
  seeders/               Default role, permission, status, dan user awal
resources/js/
  actions/               Wayfinder generated controller actions
  components/            Shared React components
  layouts/               App, auth, dan settings layout
  pages/                 Inertia pages
  routes/                Wayfinder generated named routes
routes/
  web.php                Route aplikasi utama
  settings.php           Route profile/security settings
```

## Modul Utama

- Dashboard: ringkasan project, task, KPI, status, overdue, dan aktivitas.
- Users: CRUD user, import/export user, role assignment, division assignment.
- Roles & Permissions: CRUD role dan sinkronisasi permissions.
- Divisions: CRUD divisi, manager divisi, slug otomatis.
- Project Statuses: status master untuk project dan task.
- Projects: CRUD project, sub-project, dependency, owner, division, priority, deadline, attachment.
- Teams: CRUD team per project, leader, dan members.
- Tasks: CRUD task, parent-child task accordion, sorting table, dependency, KPI point, overdue marker, attachment, approval flow.
- Pending Tasks: daftar task yang menunggu approval manager/superadmin.
- Flow Activities: visualisasi relasi project dan task.
- Gantt Chart: timeline project/task, marker hari ini, deadline, overdue, dan dependency.
- Profile & Security: update profile, password, passkey, two-factor authentication.

## Alur Database

### Entity Inti

```text
users
  └─ belongs to divisions via division_id
  └─ has roles/permissions via Spatie tables

divisions
  └─ has manager_id -> users.id
  └─ has many users
  └─ has many projects
  └─ has many tasks

project_statuses
  └─ shared status master untuk projects dan tasks

projects
  └─ belongs to divisions
  └─ belongs to owner user
  └─ belongs to project_statuses
  └─ optional parent_id -> projects.id
  └─ optional previous_project_id -> projects.id
  └─ has many teams
  └─ has many tasks
  └─ morph many attachments

teams
  └─ belongs to projects
  └─ optional leader_id -> users.id
  └─ many-to-many users via team_user

tasks
  └─ belongs to projects
  └─ optional parent_id -> tasks.id
  └─ optional division_id -> divisions.id
  └─ optional assignee_id -> users.id
  └─ belongs to project_statuses
  └─ optional previous_task_id -> tasks.id
  └─ has many subtasks
  └─ morph many attachments

attachments
  └─ polymorphic attachable: projects atau tasks
  └─ uploaded_by -> users.id
```

### Status Default

Seeder `ProjectStatusSeeder` membuat status:

- Backlog
- Todo
- In Progress
- Waiting Approval
- Blocked
- Done
- Canceled

Status ini dipakai oleh project dan task.

### Approval Task

Task memiliki field:

- `completed_at`: waktu task dinyatakan selesai.
- `approved_at`: waktu task disetujui manager/superadmin.

Alur approval:

1. Manager membuat task dan assign ke staff.
2. Staff mengerjakan task.
3. Staff mengubah status task ke Done.
4. Jika user bukan approver, sistem mengubah status menjadi Waiting Approval dan mengisi `completed_at`.
5. Manager/superadmin membuka Pending Tasks.
6. Manager/superadmin approve task.
7. Sistem mengubah status menjadi Done dan mengisi `approved_at`.

## Role dan Permission

Role default dibuat oleh `RolePermissionSeeder`:

### Superadmin

- Memiliki semua permission.
- Bisa mengelola semua master data, project, team, task, approval, user, role, dan status.

### Direktur

- View dashboard, user, division, status, project, team, dan task.
- View semua project dan task.
- Tidak menjalankan CRUD operasional harian.

### Vice Presiden

- View semua project dan task.
- Bisa create/update/delete task.
- Bisa update task lintas division sesuai permission.

### Manager

- Mengelola project, team, dan task di division-nya.
- Bisa approve task.
- Bisa melihat Pending Tasks.

### Staff

- Melihat project/task yang relevan dengan assignment/division.
- Bisa update task yang assigned ke user tersebut.
- Tidak bisa approve task.

## Flow Sistem

### Authentication

1. User login melalui Fortify/Inertia page.
2. Middleware membagikan `auth.user`, `auth.roles`, dan `auth.permissions` ke Inertia.
3. Sidebar dan page action difilter berdasarkan permission.

### Project Workflow

1. User dengan permission `project.create` membuat project.
2. Project wajib memiliki division, owner, status, dan priority.
3. Project dapat memiliki parent project.
4. Project dapat menunggu previous project selesai melalui dependency field.
5. Project dapat memiliki teams, tasks, dan attachments.
6. Project yang melewati `expected_deadline` dan belum Done diberi indikator overdue.

### Task Workflow

1. User dengan permission `task.create` membuat task pada project.
2. Task dapat memiliki parent task.
3. Task dapat memiliki previous task dependency.
4. Task dapat ditugaskan ke user dalam division terkait.
5. Staff mengubah task ke Done saat pekerjaan selesai.
6. Task masuk Waiting Approval jika belum di-approve.
7. Manager/superadmin approve task dari menu Pending Tasks.
8. Task yang melewati due date dan belum Done diberi indikator overdue.

### Visibility Data

- `view_all`: dapat melihat semua data.
- `view_division`: dapat melihat data sesuai division user.
- `view_assigned`: dapat melihat data yang assigned atau owned oleh user.
- Staff melihat task yang assigned ke dirinya dan tidak mendapat aksi untuk task lain.

### Notification

CRUD success/error ditampilkan menggunakan Sonner toast dari flash message Inertia.

## Halaman dan Route Utama

Semua route utama berada di balik middleware `auth` dan `verified`.

| URL | Nama Route | Deskripsi |
| --- | --- | --- |
| `/dashboard` | `dashboard` | Ringkasan performa |
| `/projects` | `projects.index` | List dan CRUD project |
| `/tasks` | `tasks.index` | List dan CRUD task |
| `/tasks/pending` | `tasks.pending` | Approval task |
| `/teams` | `teams.index` | List dan CRUD team |
| `/divisions` | `divisions.index` | List dan CRUD division |
| `/users` | `users.index` | List dan CRUD user |
| `/roles` | `roles.index` | Role dan permissions |
| `/project-statuses` | `project-statuses.index` | Master status |
| `/flow-activities` | `flow-activities.index` | Visual workflow |
| `/gantt-chart` | `gantt-chart.index` | Timeline Gantt |

## Setup Local Development

### Requirement

- PHP 8.3+
- Composer
- Node.js 22+ direkomendasikan
- npm
- PostgreSQL 14+ direkomendasikan
- Redis 6+ direkomendasikan
- Extension PHP PostgreSQL dan Redis, seperti `pdo_pgsql`, `pgsql`, dan `redis`/`phpredis`

### Install PostgreSQL dan Redis

#### macOS dengan Homebrew

```bash
brew install postgresql@16 redis
brew services start postgresql@16
brew services start redis
createdb pms_apn
```

#### Ubuntu/Debian

```bash
sudo apt update
sudo apt install -y postgresql postgresql-contrib redis-server php-pgsql php-redis
sudo systemctl enable --now postgresql
sudo systemctl enable --now redis-server
```

Buat database dan user PostgreSQL:

```bash
sudo -u postgres psql
```

Lalu jalankan di prompt PostgreSQL:

```sql
CREATE DATABASE pms_apn;
CREATE USER pms_apn WITH ENCRYPTED PASSWORD 'secret';
GRANT ALL PRIVILEGES ON DATABASE pms_apn TO pms_apn;
\q
```

### Instalasi Aplikasi

```bash
composer install
npm install
cp .env.example .env
php artisan key:generate
```

Pastikan `.env` memakai PostgreSQL dan Redis sesuai `.env.example`:

```env
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=pms_apn
DB_USERNAME=postgres
DB_PASSWORD=secret

SESSION_DRIVER=database
QUEUE_CONNECTION=database

CACHE_STORE=redis
CACHE_PREFIX=pms_apn_
CACHE_DRIVER=redis

REDIS_CLIENT=phpredis
REDIS_HOST=127.0.0.1
REDIS_PASSWORD=null
REDIS_PORT=6379
```

Lalu jalankan:

```bash
php artisan migrate
php artisan db:seed
php artisan storage:link
```

### User Default

Seeder membuat user default dengan password `password`:

| Role | Email |
| --- | --- |
| Super Admin | `superadmin@mail.com` |
| Direktur | `direktur@mail.com` |
| Vice Presiden | `vicedirektur@mail.com` |
| Manager | `manager@mail.com` |
| Staff | `staff@mail.com` |

### Menjalankan Aplikasi

Pilihan 1, gunakan script terpadu:

```bash
composer run dev
```

Pilihan 2, jalankan service terpisah:

```bash
php artisan serve
npm run dev
php artisan queue:listen --tries=1
```

Aplikasi development biasanya berjalan di:

```text
http://127.0.0.1:8000
```

## Command Penting

### Frontend

```bash
npm run dev
npm run build
npm run types:check
npm run format
npm run format:check
npm run lint
npm run lint:check
```

### Backend

```bash
php artisan migrate
php artisan db:seed
php artisan test
php artisan route:list
php artisan optimize:clear
php artisan wayfinder:generate --with-form --no-interaction
```

### Quality Check

```bash
npm run types:check
npm run format:check
composer run lint:check
php artisan test
npm run build
```

Atau gunakan composer script:

```bash
composer run ci:check
```

## Deployment

### 1. Persiapan Server

Server production minimal membutuhkan:

- PHP 8.3+
- Composer
- Node.js dan npm untuk build asset, atau build asset dilakukan di CI
- Web server Nginx/Apache
- PostgreSQL
- Redis untuk cache
- Supervisor/systemd untuk queue worker
- SSL certificate

Pastikan extension PHP Laravel tersedia, seperti:

- `pdo`
- `pdo_pgsql`
- `pgsql`
- `redis`
- `mbstring`
- `openssl`
- `tokenizer`
- `xml`
- `ctype`
- `json`
- `fileinfo`
- `curl`
- `zip`

### 2. Install PostgreSQL dan Redis di Server

Contoh untuk Ubuntu/Debian:

```bash
sudo apt update
sudo apt install -y postgresql postgresql-contrib redis-server php8.3-pgsql php8.3-redis
sudo systemctl enable --now postgresql
sudo systemctl enable --now redis-server
```

Buat database dan user production:

```bash
sudo -u postgres psql
```

Lalu jalankan di prompt PostgreSQL:

```sql
CREATE DATABASE pms_apn;
CREATE USER pms_apn WITH ENCRYPTED PASSWORD 'strong-password';
GRANT ALL PRIVILEGES ON DATABASE pms_apn TO pms_apn;
\q
```

Cek Redis:

```bash
redis-cli ping
```

Output yang diharapkan:

```text
PONG
```

### 3. Clone dan Install Dependency

```bash
git clone <repository-url> pms_apn
cd pms_apn
composer install --no-dev --optimize-autoloader
npm ci
npm run build
```

Jika asset dibuild oleh CI/CD, folder `public/build` dapat dikirim sebagai artifact dan server tidak perlu menjalankan npm.

### 4. Konfigurasi Environment

```bash
cp .env.example .env
php artisan key:generate
```

Contoh konfigurasi production:

```env
APP_NAME="PMS APN"
APP_ENV=production
APP_DEBUG=false
APP_URL=https://domain-production.com

DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=pms_apn
DB_USERNAME=pms_apn
DB_PASSWORD=strong-password

SESSION_DRIVER=database
QUEUE_CONNECTION=database
CACHE_STORE=redis
CACHE_PREFIX=pms_apn_
CACHE_DRIVER=redis
FILESYSTEM_DISK=public

REDIS_CLIENT=phpredis
REDIS_HOST=127.0.0.1
REDIS_PASSWORD=null
REDIS_PORT=6379

MAIL_MAILER=smtp
MAIL_HOST=smtp.example.com
MAIL_PORT=587
MAIL_USERNAME=...
MAIL_PASSWORD=...
MAIL_FROM_ADDRESS=no-reply@example.com
MAIL_FROM_NAME="${APP_NAME}"

VITE_APP_NAME="${APP_NAME}"
```

### 5. Database Migration dan Seeder

```bash
php artisan migrate --force
php artisan db:seed --class=RolePermissionSeeder --force
php artisan db:seed --class=ProjectStatusSeeder --force
```

Seeder role/status aman dijalankan ulang karena memakai `findOrCreate` dan `updateOrCreate`.

Untuk deployment pertama yang membutuhkan user awal:

```bash
php artisan db:seed --force
```

Pastikan password default diganti setelah login pertama.

### 6. Storage Link

```bash
php artisan storage:link
```

Pastikan folder berikut writable oleh web server:

```text
storage/
bootstrap/cache/
```

### 7. Optimize Laravel

```bash
php artisan optimize:clear
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan event:cache
```

### 8. Queue Worker

Jika `QUEUE_CONNECTION=database`, jalankan worker:

```bash
php artisan queue:work --tries=3 --timeout=90
```

Contoh Supervisor:

```ini
[program:pms-apn-worker]
process_name=%(program_name)s_%(process_num)02d
command=php /var/www/pms_apn/artisan queue:work --tries=3 --timeout=90
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true
user=www-data
numprocs=1
redirect_stderr=true
stdout_logfile=/var/www/pms_apn/storage/logs/worker.log
stopwaitsecs=3600
```

Reload supervisor:

```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl restart pms-apn-worker:*
```

### 9. Nginx Example

```nginx
server {
    listen 80;
    server_name domain-production.com;
    root /var/www/pms_apn/public;

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

    location ~ ^/index\.php(/|$) {
        fastcgi_pass unix:/var/run/php/php8.3-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
        fastcgi_hide_header X-Powered-By;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }
}
```

Aktifkan HTTPS melalui Certbot atau load balancer sesuai infrastruktur.

### 10. Deployment Update

Untuk update aplikasi:

```bash
git pull
composer install --no-dev --optimize-autoloader
npm ci
npm run build
php artisan migrate --force
php artisan db:seed --class=RolePermissionSeeder --force
php artisan db:seed --class=ProjectStatusSeeder --force
php artisan optimize:clear
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan event:cache
php artisan queue:restart
```

## Backup dan Maintenance

Direkomendasikan backup rutin:

- Database production.
- Folder `storage/app/public`.
- File `.env` melalui secret manager atau backup aman.

Checklist sebelum release:

- `php artisan test`
- `npm run types:check`
- `npm run build`
- `php artisan migrate --pretend` untuk review SQL jika diperlukan
- Pastikan role permission sudah diseed
- Pastikan queue worker berjalan
- Pastikan storage link dan permission folder benar

## Troubleshooting

### Asset tidak muncul

```bash
npm run build
php artisan optimize:clear
```

Pastikan `public/build/manifest.json` ada.

### Upload file gagal

```bash
php artisan storage:link
chmod -R ug+rw storage bootstrap/cache
```

Pastikan `FILESYSTEM_DISK=public` jika menggunakan public disk.

### Permission role tidak update

```bash
php artisan db:seed --class=RolePermissionSeeder --force
php artisan permission:cache-reset
```

### Route/action frontend tidak mengenali route baru

```bash
php artisan wayfinder:generate --with-form --no-interaction
npm run types:check
```

### Queue tidak memproses job

```bash
php artisan queue:restart
php artisan queue:work --tries=3
```

Jika memakai Supervisor, cek log worker di `storage/logs/worker.log`.

## Catatan Pengembangan

- Gunakan Form Request untuk validasi dan authorization.
- Gunakan Service class untuk business logic CRUD/workflow.
- Gunakan Wayfinder untuk route/action frontend, hindari hardcoded URL.
- Gunakan permission check dari Inertia shared props untuk mengatur action UI.
- Jalankan formatter dan typecheck sebelum merge.
