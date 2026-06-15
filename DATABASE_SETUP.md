# Database Setup

StreetPulse uses PostgreSQL. Run these commands once before starting the backend.

## Local Setup

```bash
psql -U postgres
CREATE DATABASE streetpulse;
\q
```

If your PostgreSQL user has a password, set it in `application.properties`:

```
spring.datasource.password=yourpassword
```

## First Run

On first startup the DataSeeder will insert 20 seed incidents automatically.
Subsequent restarts skip seeding (it checks `count() > 0`).
