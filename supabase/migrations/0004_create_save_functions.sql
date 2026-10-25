-- 올리기를 한 덩어리로 묶는 함수들.
-- REST로 여러 번 나눠 부르면 중간에 끊겼을 때 "뽑기는 올라갔는데 조약돌은 안 올라간" 상태가 남는다.
-- 함수 하나는 통째로 한 트랜잭션이라, 중간에 실패하면 전부 되돌아간다.
--
-- security invoker: 함수 안에서도 호출한 사람의 권한으로 동작한다 (RLS 그대로 적용).
-- set search_path: 함수가 엉뚱한 스키마의 테이블을 보지 않게 고정한다.

create or replace function public.save_stone_with_pocket(p_pocket jsonb, p_stone jsonb)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  insert into public.pocket (id, user_id, start_date, end_date, created_at, updated_at)
  values (
    (p_pocket ->> 'id')::uuid,
    (p_pocket ->> 'user_id')::uuid,
    (p_pocket ->> 'start_date')::date,
    (p_pocket ->> 'end_date')::date,
    (p_pocket ->> 'created_at')::timestamptz,
    (p_pocket ->> 'updated_at')::timestamptz
  )
  on conflict (id) do update set
    start_date = excluded.start_date,
    end_date = excluded.end_date,
    updated_at = excluded.updated_at;

  insert into public.stone (
    id, user_id, pocket_id, plan_id, title, kind, weekly_n_target, created_at, updated_at
  )
  values (
    (p_stone ->> 'id')::uuid,
    (p_stone ->> 'user_id')::uuid,
    (p_stone ->> 'pocket_id')::uuid,
    (p_stone ->> 'plan_id')::uuid,
    p_stone ->> 'title',
    p_stone ->> 'kind',
    (p_stone ->> 'weekly_n_target')::integer,
    (p_stone ->> 'created_at')::timestamptz,
    (p_stone ->> 'updated_at')::timestamptz
  )
  on conflict (id) do update set
    pocket_id = excluded.pocket_id,
    plan_id = excluded.plan_id,
    title = excluded.title,
    kind = excluded.kind,
    weekly_n_target = excluded.weekly_n_target,
    updated_at = excluded.updated_at;
end;
$$;

create or replace function public.save_daily_draw(p_pocket jsonb, p_draw jsonb, p_stones jsonb)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  insert into public.pocket (id, user_id, start_date, end_date, created_at, updated_at)
  values (
    (p_pocket ->> 'id')::uuid,
    (p_pocket ->> 'user_id')::uuid,
    (p_pocket ->> 'start_date')::date,
    (p_pocket ->> 'end_date')::date,
    (p_pocket ->> 'created_at')::timestamptz,
    (p_pocket ->> 'updated_at')::timestamptz
  )
  on conflict (id) do update set
    start_date = excluded.start_date,
    end_date = excluded.end_date,
    updated_at = excluded.updated_at;

  insert into public.daily_draw (
    id, user_id, draw_date, pocket_id, reroll_count, confirmed_at, rested_at, created_at, updated_at
  )
  values (
    (p_draw ->> 'id')::uuid,
    (p_draw ->> 'user_id')::uuid,
    (p_draw ->> 'draw_date')::date,
    (p_draw ->> 'pocket_id')::uuid,
    (p_draw ->> 'reroll_count')::integer,
    (p_draw ->> 'confirmed_at')::timestamptz,
    (p_draw ->> 'rested_at')::timestamptz,
    (p_draw ->> 'created_at')::timestamptz,
    (p_draw ->> 'updated_at')::timestamptz
  )
  on conflict (id) do update set
    reroll_count = excluded.reroll_count,
    confirmed_at = excluded.confirmed_at,
    rested_at = excluded.rested_at,
    updated_at = excluded.updated_at;

  -- 다시 뽑으면 그날 조약돌이 통째로 바뀐다. 지우고 다시 넣는 것이 가장 단순하다.
  delete from public.daily_draw_stone where draw_id = (p_draw ->> 'id')::uuid;

  insert into public.daily_draw_stone (id, draw_id, stone_id, cant_do_at, created_at)
  select
    (item ->> 'id')::uuid,
    (item ->> 'draw_id')::uuid,
    (item ->> 'stone_id')::uuid,
    (item ->> 'cant_do_at')::timestamptz,
    (item ->> 'created_at')::timestamptz
  from jsonb_array_elements(p_stones) as item;
end;
$$;

grant execute on function public.save_stone_with_pocket(jsonb, jsonb) to authenticated;
grant execute on function public.save_daily_draw(jsonb, jsonb, jsonb) to authenticated;
