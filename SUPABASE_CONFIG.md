# Supabase Configuration Guide

This document outlines the database schema and Row Level Security (RLS) policies required for the FinanceAI application.

## Database Tables

### 1. `categories`
Stores custom income and expense categories for each user.

| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | `uuid` | Primary Key (Default: `gen_random_uuid()`) |
| `user_id` | `uuid` | Foreign Key to `auth.users` |
| `name` | `text` | Name of the category |
| `type` | `text` | Either `'income'` or `'expense'` |
| `created_at` | `timestamptz` | Default: `now()` |

**RLS Policies:**
- `Enable insert for authenticated users only`: `auth.uid() = user_id`
- `Enable view for users based on user_id`: `auth.uid() = user_id`
- `Enable update for users based on user_id`: `auth.uid() = user_id`
- `Enable delete for users based on user_id`: `auth.uid() = user_id`

---

### 2. `transactions`
Stores all financial records (income and expenses).

| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | `uuid` | Primary Key (Default: `gen_random_uuid()`) |
| `user_id` | `uuid` | Foreign Key to `auth.users` |
| `amount` | `numeric` | Transaction amount |
| `description` | `text` | Short description of the transaction |
| `type` | `text` | Either `'income'` or `'expense'` |
| `category_id` | `uuid` | Foreign Key to `categories.id` (on delete set null) |
| `transaction_date` | `date` | Date of the transaction |
| `created_at` | `timestamptz` | Default: `now()` |

**RLS Policies:**
- `Users can view their own transactions`: `auth.uid() = user_id`
- `Users can insert their own transactions`: `auth.uid() = user_id`
- `Users can update their own transactions`: `auth.uid() = user_id`
- `Users can delete their own transactions`: `auth.uid() = user_id`

---

### 3. `budgets`
Stores monthly budget limits per category.

| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | `uuid` | Primary Key (Default: `gen_random_uuid()`) |
| `user_id` | `uuid` | Foreign Key to `auth.users` |
| `category_id` | `uuid` | Foreign Key to `categories.id` (on delete cascade) |
| `amount` | `numeric` | Budget limit amount |
| `period` | `text` | Default: `'monthly'` |
| `created_at` | `timestamptz` | Default: `now()` |

**RLS Policies:**
- `Users can view their own budgets`: `auth.uid() = user_id`
- `Users can insert their own budgets`: `auth.uid() = user_id`
- `Users can update their own budgets`: `auth.uid() = user_id`
- `Users can delete their own budgets`: `auth.uid() = user_id`

## SQL Migration Snippet

If you need to set up the tables manually, run this in your Supabase SQL Editor:

```sql
-- Categories Table
create table categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  name text not null,
  type text check (type in ('income', 'expense')) not null,
  created_at timestamptz default now()
);

-- Transactions Table
create table transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  amount numeric not null,
  description text,
  type text check (type in ('income', 'expense')) not null,
  category_id uuid references categories(id) on delete set null,
  transaction_date date not null default current_date,
  created_at timestamptz default now()
);

-- Budgets Table
create table budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  category_id uuid references categories(id) on delete cascade,
  amount numeric not null,
  period text default 'monthly',
  created_at timestamptz default now(),
  unique(user_id, category_id)
);

-- Enable RLS
alter table categories enable row level security;
alter table transactions enable row level security;
alter table budgets enable row level security;

-- Add RLS Policies (example for categories)
create policy "Users can manage their own categories" on categories
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- (Repeat policy logic for transactions and budgets)
```
