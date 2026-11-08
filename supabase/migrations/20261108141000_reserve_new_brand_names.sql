-- Reserve the new brand names (renamed to "Eme Coffea et Thea", 2026-11-08).
insert into public.reserved_usernames (username) values
  ('eme'), ('emecoffea'), ('emecoffeaetthea'), ('eme-coffea-et-thea'), ('coffea-et-thea')
on conflict do nothing;
