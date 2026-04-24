=== Setup Instructions ===

1. Pull the repo
2. Copy .env.example to .env.local and fill in your MySQL password and a JWT_SECRET (any random string)
3. In MySQL, run db/schema.sql to create all tables
4. In MySQL, run db/seed.sql to populate data
5. In the backend/ folder, run: node seed-users.js
6. Run npm install in both backend/ and frontend/
7. Start backend: npm start (inside backend/)
8. Start frontend: npm run dev (inside frontend/)

Note: If you already have the database from before, run this manually in MySQL:
ALTER TABLE Assignment ADD COLUMN dueDate DATE;
