-- public.plan: 로컬 SQLite의 plan 테이블과 짝을 이루는 클라우드 테이블.
-- 지금은 동기화 로직이 없어서 이 테이블에 실제로 데이터가 오가진 않는다 (다음 작업에서 연결 예정).
create table public.plan (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null,
  period text not null,
  title text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.plan enable row level security;

create policy "본인 계획만 조회 가능"
  on public.plan for select
  using (auth.uid() = user_id);

create policy "본인 계획만 추가 가능"
  on public.plan for insert
  with check (auth.uid() = user_id);

create policy "본인 계획만 수정 가능"
  on public.plan for update
  using (auth.uid() = user_id);

create policy "본인 계획만 삭제 가능"
  on public.plan for delete
  using (auth.uid() = user_id);
