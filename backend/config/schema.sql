

CREATE DATABASE rento_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE rento_db;


CREATE TABLE  users (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  first_name      VARCHAR(50)  NOT NULL,
  last_name       VARCHAR(50)  NOT NULL,
  email           VARCHAR(100) UNIQUE NOT NULL,
  phone           VARCHAR(20)  NOT NULL,
  password_hash   VARCHAR(255) NOT NULL,
  role            ENUM('customer','staff','admin') DEFAULT 'customer',
  profile_image   VARCHAR(255),
  address         TEXT,
  date_of_birth   DATE,
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);


CREATE TABLE  identity_verifications (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  user_id           INT NOT NULL,
  citizenship_doc   VARCHAR(255),
  license_doc       VARCHAR(255),
  user_photo        VARCHAR(255),
  status            ENUM('pending','approved','rejected') DEFAULT 'pending',
  rejection_reason  TEXT,
  reviewed_by       INT,
  reviewed_at       TIMESTAMP NULL,
  submitted_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)     REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
);


CREATE TABLE  vehicles (
  id                    INT AUTO_INCREMENT PRIMARY KEY,
  model_name            VARCHAR(100) NOT NULL,
  brand                 VARCHAR(50)  NOT NULL,
  type                  ENUM('scooter','bike','car') NOT NULL,
  fuel_type             ENUM('petrol','electric','diesel') DEFAULT 'petrol',
  transmission          ENUM('manual','automatic') DEFAULT 'manual',
  price_per_day         DECIMAL(10,2) NOT NULL,
  status                ENUM('available','rented','maintenance') DEFAULT 'available',
  registration_number   VARCHAR(30) UNIQUE NOT NULL,
  year_manufactured     YEAR,
  color                 VARCHAR(30),
  description           TEXT,
  image_url             VARCHAR(500),
  created_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);


CREATE TABLE  bookings (
  id                    INT AUTO_INCREMENT PRIMARY KEY,
  user_id               INT NOT NULL,
  vehicle_id            INT NOT NULL,
  start_date            DATE NOT NULL,
  end_date              DATE NOT NULL,
  total_days            INT NOT NULL,
  total_price           DECIMAL(10,2) NOT NULL,
  status                ENUM('pending','confirmed','active','completed','cancelled') DEFAULT 'pending',
  soft_lock_expires_at  TIMESTAMP NULL,
  notes                 TEXT,
  created_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)    REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
);

CREATE TABLE  payments (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  booking_id       INT NOT NULL,
  user_id          INT NOT NULL,
  amount           DECIMAL(10,2) NOT NULL,
  payment_method   ENUM('esewa','khalti','cash','card') NOT NULL,
  transaction_id   VARCHAR(100) UNIQUE,
  status           ENUM('pending','completed','failed','refunded') DEFAULT 'pending',
  payment_date     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE
);

CREATE TABLE  notifications (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT NOT NULL,
  title      VARCHAR(150) NOT NULL,
  message    TEXT NOT NULL,
  type       ENUM('booking','verification','payment','system') DEFAULT 'system',
  is_read    BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE  reviews (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  booking_id  INT NOT NULL,
  user_id     INT NOT NULL,
  vehicle_id  INT NOT NULL,
  rating      TINYINT CHECK (rating BETWEEN 1 AND 5),
  comment     TEXT,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id)  REFERENCES bookings(id)  ON DELETE CASCADE,
  FOREIGN KEY (user_id)     REFERENCES users(id)     ON DELETE CASCADE,
  FOREIGN KEY (vehicle_id)  REFERENCES vehicles(id)  ON DELETE CASCADE
);


INSERT INTO users (first_name, last_name, email, phone, password_hash, role) VALUES
('Super',  'Admin',  'admin@rento.com', '9800000000',
 '$2b$10$placeholder_run_reset_password_script_to_fix', 'admin'),
('Ram',    'Sharma', 'staff@rento.com', '9800000001',
 '$2b$10$placeholder_run_reset_password_script_to_fix', 'staff'),
('Sita',   'Devi',   'customer@rento.com', '9800000002',
 '$2b$10$placeholder_run_reset_password_script_to_fix', 'customer');

-- Vehicles
INSERT INTO vehicles
  (model_name, brand, type, fuel_type, transmission, price_per_day,
   registration_number, year_manufactured, color, description, image_url)
VALUES
('Pulsar NS200',  'Bajaj',   'bike',    'petrol',   'manual',    800.00,
 'BA-1-CHA-1234', 2022, 'Black',
 'Sporty 200cc bike perfect for city and highway rides. Excellent mileage and handling.',
 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800&auto=format&fit=crop'),

('Activa 6G',     'Honda',   'scooter', 'petrol',   'automatic', 500.00,
 'BA-1-CHA-5678', 2023, 'Pearl White',
 'Nepal''s most popular automatic scooter. Ideal for daily city commutes.',
 'https://images.unsplash.com/photo-1558981359-219d6364c9c8?w=800&auto=format&fit=crop'),

('Swift Dzire',   'Suzuki',  'car',     'petrol',   'automatic', 2500.00,
 'BA-1-CHA-9012', 2021, 'Silver',
 'Comfortable sedan ideal for family trips and outstation travel. AC equipped.',
 'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=800&auto=format&fit=crop'),

('Duke 390',      'KTM',     'bike',    'petrol',   'manual',    1200.00,
 'BA-2-JHA-1111', 2023, 'Orange',
 'High-performance adventure bike for thrill seekers. 390cc liquid-cooled engine.',
 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=800&auto=format&fit=crop'),

('NMax 155',      'Yamaha',  'scooter', 'petrol',   'automatic', 700.00,
 'BA-2-JHA-2222', 2022, 'Matte Blue',
 'Premium maxi-scooter with sporty design, ABS and traction control.',
 'https://images.unsplash.com/photo-1449426468159-d96dbf08f19f?w=800&auto=format&fit=crop'),

('Nexon EV',      'Tata',    'car',     'electric', 'automatic', 3000.00,
 'BA-3-PA-3333', 2023, 'Pristine White',
 'Electric SUV with 300+ km range. Eco-friendly, zero emission city driving.',
 'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=800&auto=format&fit=crop'),

('CB Shine 125',  'Honda',   'bike',    'petrol',   'manual',    600.00,
 'BA-3-PA-4444', 2022, 'Red',
 'Reliable commuter bike with excellent fuel efficiency. Great for beginners.',
 'https://images.unsplash.com/photo-1558981033-0f0309284409?w=800&auto=format&fit=crop'),

('WagonR',        'Suzuki',  'car',     'petrol',   'manual',    2000.00,
 'BA-4-GA-5555', 2020, 'White',
 'Spacious hatchback for family outings and city drives. High ground clearance.',
 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&auto=format&fit=crop'),

('Dio 110',       'Honda',   'scooter', 'petrol',   'automatic', 450.00,
 'BA-4-GA-6666', 2022, 'Red',
 'Lightweight city scooter with sporty looks. Easy to handle for beginners.',
 'https://images.unsplash.com/photo-1558981420-87aa9dad1c89?w=800&auto=format&fit=crop'),

('Fortuner',      'Toyota',  'car',     'diesel',   'automatic', 5000.00,
 'BA-5-BA-7777', 2022, 'Phantom Brown',
 'Premium SUV for long tours and mountain trips. 4WD with all-terrain capability.',
 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&auto=format&fit=crop');
