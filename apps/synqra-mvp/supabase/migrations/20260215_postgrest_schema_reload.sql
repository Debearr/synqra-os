-- Force PostgREST schema cache reload after automation table migrations
do $$
begin
  perform pg_notify('pgrst', 'reload schema');
end
$$;

