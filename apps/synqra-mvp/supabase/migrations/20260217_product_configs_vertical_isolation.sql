-- Vertical isolation + travel advisor enablement (config-only extension)

alter table public.product_configs
add column if not exists vertical text;

update public.product_configs
set vertical = case
  when tenant_id ilike '%travel%' then 'travel_advisor'
  else 'realtor'
end
where vertical is null or btrim(vertical) = '';

alter table public.product_configs
alter column vertical set default 'realtor';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'product_configs_vertical_check'
      and conrelid = 'public.product_configs'::regclass
  ) then
    alter table public.product_configs
    add constraint product_configs_vertical_check
    check (vertical in ('realtor', 'travel_advisor'));
  end if;
end;
$$;

create index if not exists idx_product_configs_vertical_active
on public.product_configs (vertical, active, updated_at desc);

insert into public.product_configs (
  tenant_id,
  tenant_name,
  vertical,
  brand_voice,
  platform_rules,
  content_guidelines,
  active
)
values (
  'travel-advisor',
  'Travel Advisor',
  'travel_advisor',
  '{
    "tone": "premium",
    "keywords": ["bespoke", "curated", "exclusive", "personalized"],
    "avoid": ["cheap", "budget", "guaranteed lowest price", "best", "#1 agent", "top agent"],
    "voice_notes": "Editorial, trust-first guidance with deterministic structure.",
    "terminology_map": {
      "listing": "itinerary / experience",
      "property": "destination",
      "price": "starting_from / package_price"
    },
    "compliance": "Prices subject to change. Advisor is not the travel supplier. Final pricing confirmed at booking."
  }'::jsonb,
  '{
    "email_labels": [
      "honeymoon_inquiry",
      "destination_question",
      "itinerary_request",
      "group_travel"
    ]
  }'::jsonb,
  'Travel advisor vertical runs on the same generation and governance pipeline as realtor with terminology-only substitution.',
  true
)
on conflict (tenant_id) do update
set
  tenant_name = excluded.tenant_name,
  vertical = excluded.vertical,
  brand_voice = excluded.brand_voice,
  platform_rules = excluded.platform_rules,
  content_guidelines = excluded.content_guidelines,
  active = excluded.active,
  updated_at = now();

update public.product_configs
set vertical = 'realtor'
where tenant_id = 'synqra-marketing';

