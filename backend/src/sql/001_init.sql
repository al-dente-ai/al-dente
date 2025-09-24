-- Enable required extensions
create extension if not exists "uuid-ossp";
create extension if not exists pg_trgm;

-- Users table
create table if not exists users (
  id uuid primary key default uuid_generate_v4(),
  email text not null unique,
  password_hash text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Login events table
create table if not exists login_events (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references users(id) on delete cascade,
  ip text,
  user_agent text,
  success boolean not null,
  created_at timestamptz not null default now()
);

-- Pantry items table
create table if not exists items (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references users(id) on delete cascade,
  name text not null,
  amount text, -- cups, count, weight, etc.
  expiry date, -- best-before/expiry
  categories text[] default '{}', -- e.g. {produce,dairy,meat,spices,grains,condiments}
  notes text,
  image_url text, -- optional, from scan upload
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes for items table
create index if not exists items_name_trgm_idx on items using gin (name gin_trgm_ops);
create index if not exists items_notes_trgm_idx on items using gin (notes gin_trgm_ops);
create index if not exists items_categories_idx on items using gin (categories);
create index if not exists items_user_id_idx on items (user_id);

-- Recipes table
create table if not exists recipes (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references users(id) on delete cascade,
  title text not null,
  description text,
  meal_type text not null check (meal_type in ('breakfast','lunch','dinner','snack')),
  servings int,
  prep_time_minutes int,
  ingredients jsonb not null, -- [{name, quantity}]
  steps jsonb not null,       -- ["step1", "step2", ...]
  uses_item_ids uuid[] default '{}', -- references items.id logically
  image_url text,
  created_at timestamptz not null default now()
);

-- Index for recipes table
create index if not exists recipes_user_id_idx on recipes (user_id);

-- Update function for updated_at columns
create or replace function update_updated_at_column()
returns trigger as $$
begin
  NEW.updated_at = now();
  return NEW;
end;
$$ language plpgsql;

-- Triggers for updated_at
create trigger update_users_updated_at before update on users
  for each row execute function update_updated_at_column();

create trigger update_items_updated_at before update on items
  for each row execute function update_updated_at_column();
