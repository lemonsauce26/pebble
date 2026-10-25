-- 로컬 SQLite의 pocket / stone / daily_draw / daily_draw_stone 과 짝을 이루는 클라우드 테이블.
-- 지금은 폰 → 클라우드 한 방향 올리기만 한다. 내려받기·충돌 해결은 나중 작업.

-- 조약돌을 담는 한 주. 기간을 직접 들고 있어서 나중에 기준이 바뀌어도 과거가 흔들리지 않는다.
create table public.pocket (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  start_date date not null,
  end_date date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.stone (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  pocket_id uuid not null references public.pocket (id) on delete cascade,
  plan_id uuid references public.plan (id) on delete set null,
  title text not null,
  kind text not null check (kind in ('weekly', 'daily', 'weekly_n')),
  weekly_n_target integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 하루 한 번의 뽑기. 날짜는 새벽 1시 기준이라 밤 12시 30분은 아직 어제다.
create table public.daily_draw (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  draw_date date not null,
  pocket_id uuid not null references public.pocket (id) on delete cascade,
  reroll_count integer not null default 0,
  confirmed_at timestamptz,
  rested_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, draw_date)
);

create table public.daily_draw_stone (
  id uuid primary key,
  draw_id uuid not null references public.daily_draw (id) on delete cascade,
  stone_id uuid not null references public.stone (id) on delete cascade,
  cant_do_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.pocket enable row level security;
alter table public.stone enable row level security;
alter table public.daily_draw enable row level security;
alter table public.daily_draw_stone enable row level security;

create policy "본인 주머니만 조회 가능" on public.pocket for select using (auth.uid() = user_id);
create policy "본인 주머니만 추가 가능" on public.pocket for insert with check (auth.uid() = user_id);
create policy "본인 주머니만 수정 가능" on public.pocket for update using (auth.uid() = user_id);
create policy "본인 주머니만 삭제 가능" on public.pocket for delete using (auth.uid() = user_id);

create policy "본인 조약돌만 조회 가능" on public.stone for select using (auth.uid() = user_id);
create policy "본인 조약돌만 추가 가능" on public.stone for insert with check (auth.uid() = user_id);
create policy "본인 조약돌만 수정 가능" on public.stone for update using (auth.uid() = user_id);
create policy "본인 조약돌만 삭제 가능" on public.stone for delete using (auth.uid() = user_id);

create policy "본인 뽑기만 조회 가능" on public.daily_draw for select using (auth.uid() = user_id);
create policy "본인 뽑기만 추가 가능" on public.daily_draw for insert with check (auth.uid() = user_id);
create policy "본인 뽑기만 수정 가능" on public.daily_draw for update using (auth.uid() = user_id);
create policy "본인 뽑기만 삭제 가능" on public.daily_draw for delete using (auth.uid() = user_id);

-- daily_draw_stone 에는 user_id 가 없다. 어느 뽑기에 속하는지로 주인을 따진다.
create policy "본인 뽑힌 조약돌만 조회 가능" on public.daily_draw_stone for select
  using (exists (select 1 from public.daily_draw d where d.id = draw_id and d.user_id = auth.uid()));
create policy "본인 뽑힌 조약돌만 추가 가능" on public.daily_draw_stone for insert
  with check (exists (select 1 from public.daily_draw d where d.id = draw_id and d.user_id = auth.uid()));
create policy "본인 뽑힌 조약돌만 수정 가능" on public.daily_draw_stone for update
  using (exists (select 1 from public.daily_draw d where d.id = draw_id and d.user_id = auth.uid()));
create policy "본인 뽑힌 조약돌만 삭제 가능" on public.daily_draw_stone for delete
  using (exists (select 1 from public.daily_draw d where d.id = draw_id and d.user_id = auth.uid()));
