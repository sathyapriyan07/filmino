-- ============================================================
-- MOVIEDB SUPABASE SCHEMA
-- Run this in Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- USERS TABLE
-- ============================================================
create table public.users (
  id uuid references auth.users(id) on delete cascade primary key,
  username text unique not null,
  email text unique not null,
  role text not null default 'user' check (role in ('admin', 'user')),
  approved boolean not null default false,
  avatar_url text,
  created_at timestamptz default now()
);

alter table public.users enable row level security;

create policy "Users can view own profile" on public.users
  for select using (auth.uid() = id);

create policy "Admins can view all users" on public.users
  for select using (
    exists (select 1 from public.users where id = auth.uid() and role = 'admin')
  );

create policy "Admins can update users" on public.users
  for update using (
    exists (select 1 from public.users where id = auth.uid() and role = 'admin')
  );

create policy "Users can update own profile" on public.users
  for update using (auth.uid() = id);

create policy "Allow insert on signup" on public.users
  for insert with check (auth.uid() = id);

-- ============================================================
-- GENRES TABLE
-- ============================================================
create table public.genres (
  id serial primary key,
  name text not null unique,
  backdrop_media_id integer,
  backdrop_media_type text
);

alter table public.genres enable row level security;
create policy "Public read genres" on public.genres for select using (true);
create policy "Admins manage genres" on public.genres for all using (
  exists (select 1 from public.users where id = auth.uid() and role = 'admin')
);

-- ============================================================
-- MOVIES TABLE
-- ============================================================
create table public.movies (
  id serial primary key,
  tmdb_id integer unique,
  title text not null,
  original_title text,
  overview text,
  tagline text,
  status text,
  release_date date,
  runtime integer,
  poster text,
  backdrop text,
  vote_average numeric(3,1) default 0,
  vote_count integer default 0,
  popularity numeric(10,3) default 0,
  budget bigint default 0,
  revenue bigint default 0,
  genres jsonb default '[]',
  language text,
  trailer_key text,
  created_at timestamptz default now()
);

alter table public.movies enable row level security;
create policy "Public read movies" on public.movies for select using (true);
create policy "Admins manage movies" on public.movies for all using (
  exists (select 1 from public.users where id = auth.uid() and role = 'admin')
);

-- ============================================================
-- SERIES TABLE
-- ============================================================
create table public.series (
  id serial primary key,
  tmdb_id integer unique,
  name text not null,
  overview text,
  first_air_date date,
  status text,
  poster text,
  backdrop text,
  vote_average numeric(3,1) default 0,
  vote_count integer default 0,
  popularity numeric(10,3) default 0,
  genres jsonb default '[]',
  language text,
  trailer_key text,
  created_at timestamptz default now()
);

alter table public.series enable row level security;
create policy "Public read series" on public.series for select using (true);
create policy "Admins manage series" on public.series for all using (
  exists (select 1 from public.users where id = auth.uid() and role = 'admin')
);

-- ============================================================
-- SEASONS TABLE
-- ============================================================
create table public.seasons (
  id serial primary key,
  series_id integer references public.series(id) on delete cascade,
  season_number integer not null,
  name text,
  overview text,
  poster text,
  air_date date,
  unique(series_id, season_number)
);

alter table public.seasons enable row level security;
create policy "Public read seasons" on public.seasons for select using (true);
create policy "Admins manage seasons" on public.seasons for all using (
  exists (select 1 from public.users where id = auth.uid() and role = 'admin')
);

-- ============================================================
-- EPISODES TABLE
-- ============================================================
create table public.episodes (
  id serial primary key,
  season_id integer references public.seasons(id) on delete cascade,
  episode_number integer not null,
  name text,
  overview text,
  runtime integer,
  air_date date,
  rating numeric(3,1) default 0,
  still text
);

alter table public.episodes enable row level security;
create policy "Public read episodes" on public.episodes for select using (true);
create policy "Admins manage episodes" on public.episodes for all using (
  exists (select 1 from public.users where id = auth.uid() and role = 'admin')
);

-- ============================================================
-- PERSONS TABLE
-- ============================================================
create table public.persons (
  id serial primary key,
  tmdb_id integer unique,
  name text not null,
  profile_image text,
  biography text,
  birthday date,
  place_of_birth text,
  known_for_department text
);

alter table public.persons enable row level security;
create policy "Public read persons" on public.persons for select using (true);
create policy "Admins manage persons" on public.persons for all using (
  exists (select 1 from public.users where id = auth.uid() and role = 'admin')
);

-- ============================================================
-- CREDITS TABLE
-- ============================================================
create table public.credits (
  id serial primary key,
  media_id integer not null,
  media_type text not null check (media_type in ('movie', 'series', 'episode')),
  person_id integer references public.persons(id) on delete cascade,
  role text not null check (role in ('cast', 'crew')),
  character text,
  job text,
  department text,
  "order" integer default 0
);

alter table public.credits enable row level security;
create policy "Public read credits" on public.credits for select using (true);
create policy "Admins manage credits" on public.credits for all using (
  exists (select 1 from public.users where id = auth.uid() and role = 'admin')
);

-- ============================================================
-- REVIEWS TABLE
-- ============================================================
create table public.reviews (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade,
  media_id integer not null,
  media_type text not null check (media_type in ('movie', 'series')),
  rating numeric(3,1),
  review_text text,
  created_at timestamptz default now(),
  unique(user_id, media_id, media_type)
);

alter table public.reviews enable row level security;
create policy "Public read reviews" on public.reviews for select using (true);
create policy "Users manage own reviews" on public.reviews for all using (auth.uid() = user_id);

-- ============================================================
-- WATCHLIST TABLE
-- ============================================================
create table public.watchlist (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade,
  media_id integer not null,
  media_type text not null check (media_type in ('movie', 'series')),
  added_at timestamptz default now(),
  unique(user_id, media_id, media_type)
);

alter table public.watchlist enable row level security;
create policy "Users manage own watchlist" on public.watchlist for all using (auth.uid() = user_id);

-- ============================================================
-- RATINGS TABLE
-- ============================================================
create table public.ratings (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade,
  media_id integer not null,
  media_type text not null,
  rating numeric(3,1) not null,
  created_at timestamptz default now(),
  unique(user_id, media_id, media_type)
);

alter table public.ratings enable row level security;
create policy "Users manage own ratings" on public.ratings for all using (auth.uid() = user_id);
create policy "Public read ratings" on public.ratings for select using (true);

-- ============================================================
-- SECTIONS TABLE
-- ============================================================
create table public.sections (
  id serial primary key,
  title text not null,
  type text not null check (type in ('movie', 'series', 'mixed')),
  order_index integer default 0,
  is_active boolean default true
);

alter table public.sections enable row level security;
create policy "Public read sections" on public.sections for select using (true);
create policy "Admins manage sections" on public.sections for all using (
  exists (select 1 from public.users where id = auth.uid() and role = 'admin')
);

-- ============================================================
-- SECTION ITEMS TABLE
-- ============================================================
create table public.section_items (
  id serial primary key,
  section_id integer references public.sections(id) on delete cascade,
  media_id integer not null,
  media_type text not null check (media_type in ('movie', 'series')),
  order_index integer default 0
);

alter table public.section_items enable row level security;
create policy "Public read section_items" on public.section_items for select using (true);
create policy "Admins manage section_items" on public.section_items for all using (
  exists (select 1 from public.users where id = auth.uid() and role = 'admin')
);

-- ============================================================
-- IMAGES TABLE
-- ============================================================
create table public.media_images (
  id serial primary key,
  media_id integer not null,
  media_type text not null,
  file_path text not null,
  image_type text not null check (image_type in ('backdrop', 'poster', 'logo'))
);

alter table public.media_images enable row level security;
create policy "Public read images" on public.media_images for select using (true);
create policy "Admins manage images" on public.media_images for all using (
  exists (select 1 from public.users where id = auth.uid() and role = 'admin')
);

-- ============================================================
-- VIDEOS TABLE
-- ============================================================
create table public.media_videos (
  id serial primary key,
  media_id integer not null,
  media_type text not null,
  name text,
  key text not null,
  site text default 'YouTube',
  video_type text
);

alter table public.media_videos enable row level security;
create policy "Public read videos" on public.media_videos for select using (true);
create policy "Admins manage videos" on public.media_videos for all using (
  exists (select 1 from public.users where id = auth.uid() and role = 'admin')
);

-- ============================================================
-- FUNCTION: Auto-create user profile on signup
-- ============================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.users (id, email, username, role, approved)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'user'),
    case when coalesce(new.raw_user_meta_data->>'role', 'user') = 'admin' then true else false end
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- INDEXES
-- ============================================================
create index idx_movies_title on public.movies using gin(to_tsvector('english', title));
create index idx_series_name on public.series using gin(to_tsvector('english', name));
create index idx_persons_name on public.persons using gin(to_tsvector('english', name));
create index idx_credits_media on public.credits(media_id, media_type);
create index idx_credits_person on public.credits(person_id);
create index idx_reviews_media on public.reviews(media_id, media_type);
create index idx_watchlist_user on public.watchlist(user_id);
create index idx_section_items_section on public.section_items(section_id);
