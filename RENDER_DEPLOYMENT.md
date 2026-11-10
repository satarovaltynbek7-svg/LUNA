# Render deployment

LUNA uses a Render Node web service for the Express API and Vite build, plus a Django API service for menu and customer orders. Both APIs share the same Render PostgreSQL database: Django maps the menu/order tables owned by Prisma, so the existing owner dashboard and Django Admin work with the same records. The checked-in `render.yaml` provisions both services and the database. Never commit `.env`, database credentials, OAuth/SMTP secrets, or production passwords.

## Local development

1. Install Node.js 20 or newer and create a local PostgreSQL database.
2. Copy `.env.example` to `.env` and set `DATABASE_URL`, a random `JWT_SECRET` of at least 32 characters, and the local URLs. Configure the OAuth and SMTP values when testing those features.
3. Run `npm install`, `npm run db:generate`, and `npm run db:migrate` to apply the checked-in initial migration.
4. Install Django dependencies with `python -m pip install -r backend\django_backend\requirements.txt`; run `cd backend\django_backend`, `python manage.py migrate`, and `python manage.py runserver 8000` in one terminal. Run `npm run server:dev` and `npm run dev` in separate terminals. Frontend code is in `frontend/`; Express and Django APIs and Prisma are in `backend/`. Vite proxies `/api` to Express on port 3001 and `/django-api` to Django on port 8000.

After changing `backend/prisma/schema.prisma`, create and commit new migrations with `npm run db:migrate:dev -- --name <migration-name>`.

## Deploy to Render

1. Push the project to a private GitHub repository and create a Render Blueprint from `render.yaml`. The blueprint creates the PostgreSQL database and Node/Python web services.
2. Set `FRONTEND_URL` and `BACKEND_URL` to the exact HTTPS origin Render assigns to the service (for example `https://luna-cafe-<your-id>.onrender.com`).
3. In Render's service environment, set `OWNER_ADMIN_PASSWORD` to a new, unique password with at least 16 characters, upper- and lowercase letters, a number, and a symbol. Do not reuse a password from a chat or commit it to source control. The owner email is fixed to `asema008@gmail.com`. At startup, the service bcrypt-hashes the environment password and creates/updates that account as the sole ADMIN; all other ADMIN roles are demoted. Rotating this variable updates the owner's password and invalidates their existing sessions.
4. The owner signs into `/admin` using the fixed email and the Render-configured password. New account registrations cannot claim the owner email or select an admin role. No SQL role-promotion step is needed.
5. To enable Google customer login, set `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `GOOGLE_CALLBACK_URL` to a backend callback URL; register that exact URL with Google. To enable password reset, configure `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD`, and `SMTP_FROM`.
6. Deploy. Render runs `npm run db:migrate` before starting the service. The app creates the owner account and seeds the existing menu/gallery only when their records are absent. Check `/api/health` and Render deploy logs.
7. Deploy the Node service first so Prisma applies the new nullable `CafeOrder.address` column. Then set `DJANGO_ALLOWED_HOSTS` to the Django service hostname, `CORS_ALLOWED_ORIGINS` to the exact HTTPS origin of the public website, and the Node service's `VITE_DJANGO_API_URL` to `https://<django-service-host>/api`. Redeploy the Node service after setting `VITE_DJANGO_API_URL`, because Vite embeds it at build time. Check Django at `/api/health/`.
8. Create a separate Django Admin account on the Django service using `python manage.py createsuperuser` from a Render shell. The Django Admin is at `https://<django-service-host>/admin/`; do not reuse the owner website login.

The browser auth cookie is HTTP-only, Secure, and `SameSite=None` in production. Mutating API requests require a trusted `Origin`, and CORS only accepts the configured frontend/backend origins. Every admin endpoint checks both the ADMIN role and the fixed owner email. The `/admin` page includes `noindex, nofollow` metadata and an `X-Robots-Tag` response header; this is for indexing control, not access control.

## API notes

- Auth: `POST /api/auth/register`, `/login`, `/logout`, `/forgot-password`, `/reset-password`; `GET /api/auth/me`; Google OAuth starts at `GET /api/auth/google` and returns through `/api/auth/google/callback`.
- Reviews: `GET /api/reviews`, `/featured`, `/my`; `POST /api/reviews`; `PATCH /api/reviews/:id`; `DELETE /api/reviews/:id`.
- Public data: Django `GET /api/menu/`; customer ordering: Django `POST /api/orders/`. Express continues to provide `/api/gallery`, `/api/site-content`, reservations, auth, reviews, and the existing owner-admin APIs.
- Admin: owner-only `/api/admin/dashboard`, `/menu`, `/menu/categories`, `/menu/items`, `/orders`, `/reservations`, `/customers`, `/gallery`, `/content`, `/banners`, and review moderation routes.
- List endpoints accept `page` and `limit` (1–100); reviews also accepts `rating`, admin lists accept `status`.
- Express API requests use JSON and cookie credentials. The frontend defaults to same-origin `/api`; set `VITE_API_URL` only when intentionally hosting Express at a different origin. Django requests use JSON; in production set `VITE_DJANGO_API_URL` to the Django service's `/api` origin. The local frontend defaults to the `/django-api` Vite proxy.

Google OAuth and password-reset delivery require provider credentials; the app reports these features as unavailable when not configured. The owner password must be configured in Render before production startup. Database migrations and live order/reservation/admin operations require a provisioned PostgreSQL database and must be confirmed in Render after deployment.
