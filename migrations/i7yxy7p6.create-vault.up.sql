CREATE EXTENSION "uuid-ossp";
CREATE TABLE vault (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  key_id text NOT NULL,
  data bytea NOT NULL,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now(),
  accessed_at timestamp NOT NULL DEFAULT now()
);
