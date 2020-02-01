CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(120) UNIQUE NOT NULL,
    name VARCHAR(120) NOT NULL,
    phone CHAR(10) NOT NULL,
    password_hash BYTEA NOT NULL
);
SELECT diesel_manage_updated_at('users');

CREATE UNIQUE INDEX email_idx ON users(email);
