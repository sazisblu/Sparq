insert into public.arena_members (user_id)
values
  ('0653015d-9766-44b5-b2c7-b07e2ec8c40d'),
  ('12c68639-3bb9-4ba7-b806-875bdc996b14')
on conflict (user_id) do nothing;

insert into public.profiles (id, username, color_hex)
values
  ('0653015d-9766-44b5-b2c7-b07e2ec8c40d', 'sazisblu', '#57D393'),
  ('12c68639-3bb9-4ba7-b806-875bdc996b14', 'ken', '#E4B466')
on conflict (id) do update
set
  username = excluded.username,
  color_hex = excluded.color_hex;
