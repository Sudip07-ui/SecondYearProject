# 🛵 Rento – Simple Wheels Rental Platform

A full-stack vehicle rental web application built with **React.js**, **Node.js/Express**, and **MySQL**.

---

## 👥 Group Members
| Name | College ID | Section |
|------|-----------|---------|
| Akriti Shrestha | NP05CP4A240031 | L2C3 |
| Sudip Rijal | NP05CP4A240005 | L2C3 |
| Yuna Karki | NP05CP4A240054 | L2C3 |
| Prakriti Pradhan | NP05CP4A240277 | L2C3 |

---

## 🗂️ Project Structure
```
rento/
├── backend/
│   ├── config/
│   │   ├── db.js           # MySQL connection pool
│   │   ├── email.js        # Nodemailer email utility
│   │   └── schema.sql      # Full DB schema + seed data
│   ├── middleware/
│   │   ├── auth.js         # JWT protect / staffOnly / adminOnly
│   │   └── upload.js       # Multer file upload
│   ├── routes/
│   │   ├── auth.js         # Register, login, profile
│   │   ├── vehicles.js     # CRUD + availability check
│   │   ├── bookings.js     # Create, view, cancel, status
│   │   ├── payments.js     # Process payment, history
│   │   ├── verification.js # 3-step document upload
│   │   ├── notifications.js# In-app notifications
│   │   ├── admin.js        # Stats, reports, user management
│   │   └── reviews.js      # Post-rental reviews
│   ├── uploads/            # Uploaded identity documents
│   ├── .env.example
│   ├── package.json
│   └── server.js           # Express app entry point
│
└── frontend/
    ├── public/
    │   └── index.html
    └── src/
        ├── components/
        │   ├── common/
        │   │   ├── ProtectedRoute.js
        │   │   ├── VehicleCard.js
        │   │   └── VehicleCard.css
        │   └── layout/
        │       ├── Navbar.js / Navbar.css
        │       └── Footer.js / Footer.css
        ├── context/
        │   └── AuthContext.js   # Global auth state
        ├── pages/
        │   ├── auth/
        │   │   ├── Login.js
        │   │   └── Register.js
        │   ├── admin/
        │   │   ├── AdminLayout.js
        │   │   ├── AdminDashboard.js
        │   │   ├── AdminVehicles.js
        │   │   ├── AdminBookings.js
        │   │   ├── AdminVerification.js
        │   │   ├── AdminUsers.js
        │   │   └── AdminReports.js
        │   ├── Home.js
        │   ├── Vehicles.js
        │   ├── VehicleDetail.js
        │   ├── Payment.js
        │   ├── MyBookings.js
        │   ├── Verification.js
        │   ├── Profile.js
        │   └── Review.js
        ├── utils/
        │   └── api.js           # Axios instance with JWT
        ├── App.js               # All routes
        ├── index.js
        └── index.css            # Global design system
```

---

## ⚙️ Setup Instructions

### Prerequisites
- Node.js v18+
- MySQL 8.0+
- npm

---

### Step 1 – Database Setup

1. Open MySQL Workbench or terminal
2. Run the schema file:
```sql
SOURCE /path/to/rento/backend/config/schema.sql;
```
This creates `rento_db` and seeds 10 vehicles + 3 users.

---

### Step 2 – Backend Setup

```bash
cd rento/backend
npm install
cp .env.example .env
```

Edit `.env`:
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=rento_db
JWT_SECRET=rento_super_secret_2024
PORT=5000
```

Start the backend:
```bash
npm run dev      # development (nodemon)
npm start        # production
```

Backend runs at: **http://localhost:5000**

---

### Step 3 – Frontend Setup

```bash
cd rento/frontend
npm install
npm start
```

Frontend runs at: **http://localhost:3000**

---

## 🔑 Default Login Credentials

| Role     | Email                   | Password    |
|----------|-------------------------|-------------|
| Admin    | admin@rento.com         | Admin@1234  |
| Staff    | staff@rento.com         | Admin@1234  |
| Customer | customer@rento.com      | Admin@1234  |

---

## ✅ Features Implemented (from SRS)

### Customer Features
- [x] REQ-1.1 – Register with email, phone, password
- [x] REQ-1.2 – Password: min 8 chars, 1 number, 1 special char
- [x] REQ-1.3 – JWT authentication
- [x] REQ-1.4 – View and edit profile
- [x] REQ-2.1 – Browse vehicles with images and details
- [x] REQ-2.2 – Filter by type, fuel type, transmission, price
- [x] REQ-2.3 – Search by model/brand
- [x] REQ-3.1 – Date picker for start and end dates
- [x] REQ-3.2 – Real-time availability check
- [x] REQ-3.3 – 15-minute soft lock on booking
- [x] REQ-3.4 – Vehicle shown as Reserved during hold
- [x] REQ-4.1 – 3-step document upload (citizenship, license, photo)
- [x] REQ-4.2 – Documents stored securely in server
- [x] REQ-4.3 – Staff notified on submission
- [x] REQ-5.1 – Booking summary before payment
- [x] REQ-5.2 – eSewa / Khalti / Card / Cash payment options
- [x] REQ-5.3 – Vehicle marked Booked after payment
- [x] REQ-5.4 – Email confirmation sent after payment
- [x] Booking history with status tracking
- [x] Cancel booking (full refund >24h, 50% fee <24h)
- [x] Post-rental star reviews

### Admin / Staff Features
- [x] REQ-6.1 – Add / Edit / Delete vehicles
- [x] REQ-6.2 – Pending verification queue with Approve/Reject
- [x] REQ-6.3 – View and update all booking statuses
- [x] REQ-6.4 – Dashboard: total bookings, revenue, vehicles, customers
- [x] User management (view, activate/deactivate)
- [x] Booking report with date filter + CSV export
- [x] Revenue report with date filter + CSV export
- [x] Monthly revenue bar chart
- [x] Booking status breakdown chart

### Non-Functional (from SRS §5)
- [x] JWT + bcrypt security
- [x] Role-based access control (customer / staff / admin)
- [x] HTTPS-ready (TLS in production)
- [x] Responsive design (mobile, tablet, desktop)
- [x] In-app notifications (booking, payment, verification, system)
- [x] Email notifications via Nodemailer
- [x] Business rules: min 1 day, age 18+, cancellation policy

---

## 🛠️ Tech Stack
| Layer      | Technology |
|------------|-----------|
| Frontend   | React.js, React Router v6, Axios |
| Styling    | Pure CSS (custom design system) |
| Backend    | Node.js, Express.js |
| Database   | MySQL 8 + mysql2 |
| Auth       | JWT (jsonwebtoken) + bcryptjs |
| File Upload| Multer |
| Email      | Nodemailer |
| Methodology| Scrum (6 Sprints) |

---

## 📡 API Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register new user |
| POST | /api/auth/login | Login |
| GET | /api/auth/me | Get current user |
| PUT | /api/auth/profile | Update profile |
| GET | /api/vehicles | List vehicles (filterable) |
| GET | /api/vehicles/:id | Vehicle detail |
| GET | /api/vehicles/:id/availability | Check date availability |
| POST | /api/vehicles | Add vehicle (staff) |
| PUT | /api/vehicles/:id | Update vehicle (staff) |
| DELETE | /api/vehicles/:id | Delete vehicle (staff) |
| POST | /api/bookings | Create booking (soft lock) |
| GET | /api/bookings/my | My bookings |
| GET | /api/bookings | All bookings (staff) |
| PUT | /api/bookings/:id/cancel | Cancel booking |
| PUT | /api/bookings/:id/status | Update status (staff) |
| POST | /api/payments | Process payment |
| GET | /api/payments/my | Payment history |
| POST | /api/verification/submit | Upload documents |
| GET | /api/verification/my | My verification status |
| PUT | /api/verification/:id | Approve/Reject (staff) |
| GET | /api/notifications | Get notifications |
| PUT | /api/notifications/read-all | Mark all read |
| GET | /api/admin/stats | Dashboard stats |
| GET | /api/admin/users | All users |
| GET | /api/admin/reports/bookings | Booking report |
| GET | /api/admin/reports/revenue | Revenue report |
| POST | /api/reviews | Submit review |
| GET | /api/reviews/vehicle/:id | Vehicle reviews |
