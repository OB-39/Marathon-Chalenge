-- Create messages table with correct references to profiles
create table public.messages (
  id uuid default gen_random_uuid() primary key,
  sender_id uuid references public.profiles(id) on delete cascade not null,
  receiver_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  is_read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.messages enable row level security;

-- Policies
create policy "Users can see messages they sent or received"
  on public.messages for select
  using (auth.uid() = sender_id or auth.uid() = receiver_id);

create policy "Users can insert messages (sender_id must be themselves)"
  on public.messages for insert
  with check (auth.uid() = sender_id);

create policy "Users can update read status of received messages"
  on public.messages for update
  using (auth.uid() = receiver_id);
