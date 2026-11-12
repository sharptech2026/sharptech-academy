-- SharpTech Academy progress schema (per-user)
-- Applied to Neon on deploy and to PGLite in preview.
-- Each user owns their progress; queries MUST scope by user_id server-side.

create table if not exists progress (
  user_id text not null primary key,
  name text not null default '',
  course_id text not null default 'js',
  xp int not null default 0,
  daily_xp int not null default 0,
  daily_date text not null default '',
  goal int not null default 40,
  streak int not null default 0,
  best_streak int not null default 0,
  last_active text,
  hearts int not null default 5,
  hearts_date text not null default '',
  sound boolean not null default true,
  theme text not null default 'claro',
  practiced jsonb not null default '{}',
  completed jsonb not null default '{}',
  mistakes jsonb not null default '[]',
  answered int not null default 0,
  correct_answers int not null default 0,
  active_days jsonb not null default '[]',
  pending_train boolean not null default false,
  unlocked_achievements jsonb not null default '[]',
  last_achievement_check jsonb not null default '{}',
  onboarded boolean not null default false,
  created_at timestamptz default CURRENT_TIMESTAMP not null,
  updated_at timestamptz default CURRENT_TIMESTAMP not null
);

create table if not exists certificates (
  id text not null primary key,
  user_id text not null references progress(user_id) on delete cascade,
  course_id text not null,
  issued_at timestamptz default CURRENT_TIMESTAMP not null,
  xp int not null,
  completed jsonb not null default '{}',
  streak int not null,
  unique(user_id, course_id)
);

create table if not exists daily_challenges (
  id text not null primary key,
  user_id text not null references progress(user_id) on delete cascade,
  challenge_id text not null,
  completed_at timestamptz default CURRENT_TIMESTAMP not null,
  xp_earned int not null,
  bonus boolean not null default false,
  unique(user_id, challenge_id)
);

create index if not exists certificates_user_id_idx on certificates(user_id);
create index if not exists daily_challenges_user_id_idx on daily_challenges(user_id);