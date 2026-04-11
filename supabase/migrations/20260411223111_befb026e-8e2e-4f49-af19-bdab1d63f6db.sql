
-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Professionals table
CREATE TABLE public.professionals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name TEXT NOT NULL,
  owner_name TEXT,
  logo_url TEXT,
  photo_url TEXT,
  segment TEXT NOT NULL,
  specialties TEXT[] DEFAULT '{}',
  services TEXT[] DEFAULT '{}',
  description TEXT,
  location TEXT,
  advantage TEXT,
  working_hours TEXT,
  whatsapp TEXT,
  instagram TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.professionals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can view active professionals" ON public.professionals FOR SELECT USING (true);
CREATE POLICY "Allow all inserts on professionals" ON public.professionals FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all updates on professionals" ON public.professionals FOR UPDATE USING (true);
CREATE POLICY "Allow all deletes on professionals" ON public.professionals FOR DELETE USING (true);

CREATE TRIGGER update_professionals_updated_at
  BEFORE UPDATE ON public.professionals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Professional photos (portfolio)
CREATE TABLE public.professional_photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.professional_photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can view professional photos" ON public.professional_photos FOR SELECT USING (true);
CREATE POLICY "Allow all inserts on professional_photos" ON public.professional_photos FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all updates on professional_photos" ON public.professional_photos FOR UPDATE USING (true);
CREATE POLICY "Allow all deletes on professional_photos" ON public.professional_photos FOR DELETE USING (true);

-- Events table
CREATE TABLE public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can view active events" ON public.events FOR SELECT USING (true);
CREATE POLICY "Allow all inserts on events" ON public.events FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all updates on events" ON public.events FOR UPDATE USING (true);
CREATE POLICY "Allow all deletes on events" ON public.events FOR DELETE USING (true);

CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Event images
CREATE TABLE public.event_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.event_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can view event images" ON public.event_images FOR SELECT USING (true);
CREATE POLICY "Allow all inserts on event_images" ON public.event_images FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all updates on event_images" ON public.event_images FOR UPDATE USING (true);
CREATE POLICY "Allow all deletes on event_images" ON public.event_images FOR DELETE USING (true);

-- Notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can view notifications" ON public.notifications FOR SELECT USING (true);
CREATE POLICY "Allow all inserts on notifications" ON public.notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all updates on notifications" ON public.notifications FOR UPDATE USING (true);
CREATE POLICY "Allow all deletes on notifications" ON public.notifications FOR DELETE USING (true);

-- Storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('professionals', 'professionals', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('events', 'events', true);

CREATE POLICY "Public read access for professionals bucket" ON storage.objects FOR SELECT USING (bucket_id = 'professionals');
CREATE POLICY "Allow all uploads to professionals bucket" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'professionals');
CREATE POLICY "Allow all updates to professionals bucket" ON storage.objects FOR UPDATE USING (bucket_id = 'professionals');
CREATE POLICY "Allow all deletes from professionals bucket" ON storage.objects FOR DELETE USING (bucket_id = 'professionals');

CREATE POLICY "Public read access for events bucket" ON storage.objects FOR SELECT USING (bucket_id = 'events');
CREATE POLICY "Allow all uploads to events bucket" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'events');
CREATE POLICY "Allow all updates to events bucket" ON storage.objects FOR UPDATE USING (bucket_id = 'events');
CREATE POLICY "Allow all deletes from events bucket" ON storage.objects FOR DELETE USING (bucket_id = 'events');
