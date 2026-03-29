# Backend (Job Portal API)

Quick steps to run locally:

1. Copy `.env.example` to `.env` inside `Backend/` and fill in your SQL Server credentials and a strong `JWT_SECRET`.

2. Ensure you have SQL Server reachable at the configured host/port and the user has permissions to create the database/tables.
	- The server will now try to create the configured database automatically if it doesn't exist (it connects to the `master` DB briefly). Make sure the DB credentials in your `.env` have permission to create a database.

3. Install dependencies and start server:

```powershell
cd Backend
npm install
npm run start
```

The server will automatically create any missing tables (development only behaviour). If `JWT_SECRET` or DB envs are missing you will see warnings but the server will still start using safe development defaults — make sure to set production secrets before deploying.
