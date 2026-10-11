-- Shared online leaderboard for GitHub Pages. Run once in Supabase: SQL Editor -> New query -> paste -> Run.
-- Players can read the board, but can only add scores through submit_score, which checks them first
-- and keeps each nickname's best score (nicknames are not case sensitive, like the device board).

create table if not exists public.leaderboard (
    name_key text primary key,
    name text not null check (char_length(name) between 1 and 16),
    avatar text not null default '🙂' check (char_length(avatar) <= 8),
    score integer not null check (score between 0 and 5000),
    at timestamptz not null default now()
);

alter table public.leaderboard enable row level security;
drop policy if exists "Anyone can read the leaderboard" on public.leaderboard;
create policy "Anyone can read the leaderboard" on public.leaderboard for select to anon, authenticated using (true);
revoke insert, update, delete on public.leaderboard from anon, authenticated;

-- A perfect 15-question game with every bonus is under 4,000 points, so 5,000 leaves room without allowing silly scores
create or replace function public.submit_score(p_name text, p_avatar text, p_score integer)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
    clean_name text := left(btrim(coalesce(p_name, '')), 16);
begin
    if clean_name = '' or p_score is null or p_score < 0 or p_score > 5000 then
        raise exception 'Invalid score';
    end if;
    insert into public.leaderboard (name_key, name, avatar, score, at)
    values (lower(clean_name), clean_name, left(coalesce(nullif(p_avatar, ''), '🙂'), 8), p_score, now())
    on conflict (name_key) do update
        set name = excluded.name, avatar = excluded.avatar, score = excluded.score, at = excluded.at
        where excluded.score >= public.leaderboard.score;
end;
$$;

revoke all on function public.submit_score(text, text, integer) from public;
grant execute on function public.submit_score(text, text, integer) to anon, authenticated;
