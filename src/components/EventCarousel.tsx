import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { Calendar } from "lucide-react";

const EventCarousel = () => {
  const { data: events = [] } = useQuery({
    queryKey: ["events-with-images"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*, event_images(*)")
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const allImages = events.flatMap((event) =>
    (event.event_images || [])
      .sort((a: any, b: any) => a.display_order - b.display_order)
      .map((img: any) => ({ ...img, eventTitle: event.title }))
  );

  if (allImages.length === 0) {
    return (
      <div className="px-4 pb-3">
        <div className="rounded-2xl bg-gradient-to-br from-primary/10 to-accent/40 p-6 flex flex-col items-center justify-center min-h-[160px]">
          <Calendar size={36} className="text-primary mb-2 opacity-60" />
          <p className="text-sm font-medium text-muted-foreground">Nenhum evento no momento</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 pb-3">
      <h2 className="text-sm font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Eventos</h2>
      <Carousel className="w-full">
        <CarouselContent>
          {allImages.map((img) => (
            <CarouselItem key={img.id}>
              <div className="relative rounded-2xl overflow-hidden aspect-[16/9]">
                <img
                  src={img.image_url}
                  alt={img.eventTitle}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-3 left-4 right-4">
                  <p className="text-white font-bold text-sm">{img.eventTitle}</p>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </div>
  );
};

export default EventCarousel;
