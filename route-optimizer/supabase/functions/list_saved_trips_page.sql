-- Paginated History list + server-side search. Depends: public.saved_trips.
-- Returns { "total_count": <bigint>, "rows": [ ... ] }.

create or replace function public.list_saved_trips_page(
  p_limit integer default 20,
  p_offset integer default 0,
  p_search text default null,
  p_saved_only boolean default false,
  p_transport_mode text default null,
  p_newest_first boolean default true
)
returns json
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  v_limit int := least(greatest(coalesce(p_limit, 20), 1), 100);
  v_offset int := greatest(coalesce(p_offset, 0), 0);
  v_search text := nullif(trim(coalesce(p_search, '')), '');
  v_mode text := null;
  v_total bigint;
  v_rows json;
begin
  if p_transport_mode is not null and lower(p_transport_mode) in ('driving', 'walking', 'transit') then
    v_mode := lower(p_transport_mode);
  end if;

  select count(*)::bigint
  into v_total
  from public.saved_trips t
  where auth.uid() = t.user_id
    and (not p_saved_only or t.is_favorite)
    and (
      v_mode is null
      or coalesce(t.payload ->> 'transport_mode', 'driving') = v_mode
    )
    and (
      v_search is null
      or strpos(lower(coalesce(t.title, '')), lower(v_search)) > 0
      or strpos(lower(coalesce(t.payload ->> 'origin_query', '')), lower(v_search)) > 0
      or strpos(lower(coalesce(t.payload ->> 'origin_address', '')), lower(v_search)) > 0
      or exists (
        select 1
        from jsonb_array_elements(coalesce(t.payload -> 'stops_resolved', '[]'::jsonb)) as s
        where strpos(lower(coalesce(s ->> 'query', '')), lower(v_search)) > 0
           or strpos(lower(coalesce(s ->> 'address', '')), lower(v_search)) > 0
      )
    );

  if p_newest_first then
    select coalesce(
      (
        select json_agg(row_to_json(sub))
        from (
          select t.id, t.user_id, t.title, t.payload, t.created_at, t.is_favorite
          from public.saved_trips t
          where auth.uid() = t.user_id
            and (not p_saved_only or t.is_favorite)
            and (
              v_mode is null
              or coalesce(t.payload ->> 'transport_mode', 'driving') = v_mode
            )
            and (
              v_search is null
              or strpos(lower(coalesce(t.title, '')), lower(v_search)) > 0
              or strpos(lower(coalesce(t.payload ->> 'origin_query', '')), lower(v_search)) > 0
              or strpos(lower(coalesce(t.payload ->> 'origin_address', '')), lower(v_search)) > 0
              or exists (
                select 1
                from jsonb_array_elements(coalesce(t.payload -> 'stops_resolved', '[]'::jsonb)) as s
                where strpos(lower(coalesce(s ->> 'query', '')), lower(v_search)) > 0
                   or strpos(lower(coalesce(s ->> 'address', '')), lower(v_search)) > 0
              )
            )
          order by t.created_at desc
          limit v_limit
          offset v_offset
        ) sub
      ),
      '[]'::json
    )
    into v_rows;
  else
    select coalesce(
      (
        select json_agg(row_to_json(sub))
        from (
          select t.id, t.user_id, t.title, t.payload, t.created_at, t.is_favorite
          from public.saved_trips t
          where auth.uid() = t.user_id
            and (not p_saved_only or t.is_favorite)
            and (
              v_mode is null
              or coalesce(t.payload ->> 'transport_mode', 'driving') = v_mode
            )
            and (
              v_search is null
              or strpos(lower(coalesce(t.title, '')), lower(v_search)) > 0
              or strpos(lower(coalesce(t.payload ->> 'origin_query', '')), lower(v_search)) > 0
              or strpos(lower(coalesce(t.payload ->> 'origin_address', '')), lower(v_search)) > 0
              or exists (
                select 1
                from jsonb_array_elements(coalesce(t.payload -> 'stops_resolved', '[]'::jsonb)) as s
                where strpos(lower(coalesce(s ->> 'query', '')), lower(v_search)) > 0
                   or strpos(lower(coalesce(s ->> 'address', '')), lower(v_search)) > 0
              )
            )
          order by t.created_at asc
          limit v_limit
          offset v_offset
        ) sub
      ),
      '[]'::json
    )
    into v_rows;
  end if;

  return json_build_object('total_count', v_total, 'rows', v_rows);
end;
$$;

grant execute on function public.list_saved_trips_page(
  integer, integer, text, boolean, text, boolean
) to authenticated;

grant execute on function public.list_saved_trips_page(
  integer, integer, text, boolean, text, boolean
) to service_role;
