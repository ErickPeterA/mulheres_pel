import { useState, useCallback, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@/components/ui/carousel";
import { Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import ImageLightbox from "@/components/ImageLightbox";

const EventCarousel = () => {
  const [api, setApi] = useState<CarouselApi>();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const { data: events = [] } = useQuery({
    queryKey: ["events-with-images"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*, event_images(*)")
        .eq("is_active", true)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const allImages = events.flatMap((event) =>
    (event.event_images || [])
      .sort((a: any, b: any) => a.display_order - b.display_order)
      .map((img: any) => ({ ...img, eventTitle: event.title }))
  );

  const onSelect = useCallback(() => {
    if (!api) return;
    setCurrentSlide(api.selectedScrollSnap());
  }, [api]);

  useEffect(() => {
    if (!api) return;
    onSelect();
    api.on("select", onSelect);
    return () => { api.off("select", onSelect); };
  }, [api, onSelect]);

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

  const lightboxImages = allImages.map((img) => ({ url: img.image_url, title: img.eventTitle }));

  return (
    <div className="px-4 pb-3">
      <h2 className="text-sm font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Eventos</h2>
      <Carousel className="w-full" setApi={setApi}>
        <CarouselContent>
          {allImages.map((img, idx) => (
            <CarouselItem key={img.id}>
              <div
                className="relative rounded-2xl overflow-hidden aspect-[16/9] cursor-pointer"
                onClick={() => { setLightboxIndex(idx); setLightboxOpen(true); }}
              >
                <img src={img.image_url} alt={img.eventTitle} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                {/* Dot indicators */}
                {allImages.length > 1 && (
                  <div className="absolute top-3 left-0 right-0 flex justify-center gap-1.5">
                    {allImages.map((_, i) => (
                      <span
                        key={i}
                        className={cn(
                          "h-1.5 rounded-full transition-all",
                          i === currentSlide ? "bg-white w-4" : "bg-white/40 w-1.5"
                        )}
                      />
                    ))}
                  </div>
                )}
                <div className="absolute bottom-3 left-4 right-4">
                  <p className="text-white font-bold text-sm">{img.eventTitle}</p>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>

      <ImageLightbox
        images={lightboxImages}
        initialIndex={lightboxIndex}
        open={lightboxOpen}
        onOpenChange={setLightboxOpen}
      />
    </div>
  );
};

export default EventCarousel;
