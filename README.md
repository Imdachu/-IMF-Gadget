# IMF Gadget API

A secure API for managing Impossible Missions Force (IMF) gadgets, built with Node.js, Express, Prisma, and PostgreSQL.

## Features
- Gadget inventory management (CRUD)
- Random mission success probability for each gadget
- Unique codename generation for gadgets
- Soft delete (decommission) with timestamp
- Self-destruct endpoint with confirmation code
- JWT authentication for all endpoints
- Swagger (OpenAPI) documentation
- Ready for deployment on Render

## Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- PostgreSQL (local for dev, cloud for production)

### Local Setup
1. **Clone the repo:**
   ```sh
   git clone https://github.com/Imdachu/-IMF-Gadget.git
   cd -IMF-Gadget
   ```
2. **Install dependencies:**
   ```sh
   npm install
   ```
3. **Configure environment variables:**
   - Create a `.env` file in the root:
     ```env
     DATABASE_URL=your_local_postgres_url
     JWT_SECRET=your_super_secret_key
     ```
4. **Run migrations and generate Prisma client:**
   ```sh
   npx prisma generate
   npx prisma migrate dev --name init
   ```
5. **Start the server:**
   ```sh
   npm start
   ```
6. **Visit Swagger docs:**
   - [http://localhost:3000/docs](http://localhost:3000/docs)

### Deployment (Render)
1. Push your code to GitHub.
2. Create a PostgreSQL database on Render and copy the Internal Database URL.
3. Create a new Web Service on Render:
   - Build command: `npm install && npm run prisma:generate && npm run prisma:migrate`
   - Start command: `npm start`
   - Environment variables:
     - `DATABASE_URL` = (Render Internal Database URL)
     - `JWT_SECRET` = (your secret)
4. Visit your deployed API and docs at `https://your-app.onrender.com/docs`

## API Endpoints

### Authentication
- `POST /register` — Register a new user
- `POST /login` — Login and get JWT token

### Gadgets (all require JWT)
- `GET /gadgets` — List all gadgets (with optional status filter)
- `POST /gadgets` — Add a new gadget
- `PATCH /gadgets/:id` — Update a gadget
- `DELETE /gadgets/:id` — Decommission a gadget
- `POST /gadgets/:id/self-destruct` — Trigger self-destruct

### Documentation
- Swagger UI: `/docs`

## Example .env
```
DATABASE_URL=postgres://user:password@host:port/dbname
JWT_SECRET=your_super_secret_key
```

## License
MIT 