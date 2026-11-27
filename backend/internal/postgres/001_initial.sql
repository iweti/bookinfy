CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TABLE businesses (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    slug text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
    name text NOT NULL,
    address text NOT NULL DEFAULT '',
    city text NOT NULL DEFAULT '',
    opens_at integer NOT NULL CHECK (opens_at >= 0),
    closes_at integer NOT NULL CHECK (closes_at < 1440 AND closes_at > opens_at),
    weekdays smallint[] NOT NULL CHECK (cardinality(weekdays) > 0 AND weekdays <@ ARRAY[0,1,2,3,4,5,6]::smallint[])
);

CREATE TABLE users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email text NOT NULL UNIQUE,
    password_salt bytea NOT NULL,
    password_hash bytea NOT NULL
);

CREATE TABLE business_memberships (
    user_id uuid NOT NULL REFERENCES users(id),
    business_id uuid NOT NULL REFERENCES businesses(id),
    role text NOT NULL CHECK (role = 'owner'),
    PRIMARY KEY (user_id, business_id)
);

CREATE TABLE sessions (
    token_hash bytea PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES users(id),
    expires_at timestamptz NOT NULL
);
CREATE INDEX sessions_user_id ON sessions (user_id);

CREATE TABLE services (
    business_id uuid NOT NULL REFERENCES businesses(id),
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    name text NOT NULL,
    description text NOT NULL DEFAULT '',
    category text NOT NULL DEFAULT '',
    duration_minutes integer NOT NULL CHECK (duration_minutes BETWEEN 15 AND 480),
    price_cents integer NOT NULL CHECK (price_cents >= 0),
    PRIMARY KEY (business_id, id)
);

CREATE TABLE professionals (
    business_id uuid NOT NULL REFERENCES businesses(id),
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    name text NOT NULL,
    specialty text NOT NULL DEFAULT '',
    PRIMARY KEY (business_id, id)
);

CREATE TABLE professional_services (
    business_id uuid NOT NULL,
    professional_id uuid NOT NULL,
    service_id uuid NOT NULL,
    PRIMARY KEY (business_id, professional_id, service_id),
    FOREIGN KEY (business_id, professional_id) REFERENCES professionals(business_id, id),
    FOREIGN KEY (business_id, service_id) REFERENCES services(business_id, id)
);

CREATE TABLE customers (
    business_id uuid NOT NULL REFERENCES businesses(id),
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    name text NOT NULL,
    phone text NOT NULL,
    email text NOT NULL DEFAULT '',
    PRIMARY KEY (business_id, id),
    UNIQUE (business_id, phone)
);

CREATE TABLE appointments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id uuid NOT NULL,
    professional_id uuid NOT NULL,
    service_id uuid NOT NULL,
    customer_id uuid NOT NULL,
    customer_name text NOT NULL,
    price_cents integer NOT NULL CHECK (price_cents >= 0),
    starts_at timestamptz NOT NULL,
    ends_at timestamptz NOT NULL CHECK (ends_at > starts_at),
    status text NOT NULL DEFAULT 'scheduled'
        CHECK (status IN ('scheduled', 'confirmed', 'in_progress', 'completed', 'canceled', 'no_show')),
    request_id uuid NOT NULL,
    request_hash bytea NOT NULL,
    UNIQUE (business_id, request_id),
    FOREIGN KEY (business_id, professional_id, service_id)
        REFERENCES professional_services(business_id, professional_id, service_id),
    FOREIGN KEY (business_id, customer_id) REFERENCES customers(business_id, id),
    EXCLUDE USING gist (
        business_id WITH =,
        professional_id WITH =,
        tstzrange(starts_at, ends_at, '[)') WITH &&
    ) WHERE (status IN ('scheduled', 'confirmed', 'in_progress', 'completed'))
);
CREATE INDEX appointments_by_business_and_time ON appointments (business_id, starts_at);
CREATE INDEX appointments_by_professional_and_time ON appointments (business_id, professional_id, starts_at);
