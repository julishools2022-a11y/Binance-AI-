create table if not exists agent_alerts (
  id uuid primary key default gen_random_uuid(),
  symbol text not null,
  trigger_type text not null,
  trigger_detail text,
  explanation text,
  ticker_snapshot jsonb,
  created_at timestamptz default now()
);

create index if not exists agent_alerts_created_at_idx on agent_alerts (created_at desc);
