-- public.user: 로그인(auth.users)과 별개로, 앱에서 쓸 유저 정보(닉네임 등)를 담는 테이블.
-- id는 auth.users의 id와 동일한 값을 쓴다 (1:1 연결).
-- "user"는 SQL 예약어라서 반드시 큰따옴표로 감싸서 써야 한다.
create table public."user" (
  id uuid primary key references auth.users (id) on delete cascade,
  nickname text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz -- null이면 정상 회원, 값이 있으면 탈퇴 처리된 시각
);

alter table public."user" enable row level security;

create policy "본인 행만 조회 가능"
  on public."user" for select
  using (auth.uid() = id);

create policy "본인 행만 수정 가능"
  on public."user" for update
  using (auth.uid() = id);

-- 구글 로그인으로 처음 가입하면 public.user에 행을 자동으로 만든다.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public."user" (id, nickname)
  values (new.id, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
