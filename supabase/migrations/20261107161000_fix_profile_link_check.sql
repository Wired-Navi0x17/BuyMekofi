-- Postgres regex bounds cannot exceed 255 ({3,2040} raised 2201B on every
-- insert). Express the length limit separately.
alter table public.profile_links drop constraint profile_links_url_check;
alter table public.profile_links
  add constraint profile_links_url_check
  check (char_length(url) between 12 and 2048 and url ~ '^https://[^[:space:]]+\.[^[:space:]]+$');
