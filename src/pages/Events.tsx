
import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Users, Clock, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';


interface DBEvent {
  id: string;
  title: string;
  description?: string | null;
  image_url?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  is_active: boolean;
}

const Events: React.FC = () => {
  const [events, setEvents] = useState<DBEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        // Since events table doesn't exist in current schema, show empty state
        setEvents([]);
      } catch (error) {
        console.error('Failed to load events', error);
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <>
      <Helmet>
        <title>Events | Bolt Events & Contests</title>
        <meta name="description" content="Participate in the latest events and contests and win valuable prizes from BOLT and TON" />
        <link rel="canonical" href="/events" />
      </Helmet>

      <main className="safe-area pb-24">
        <div className="max-w-md mx-auto px-4 py-6">
          <div className="mb-6 relative overflow-hidden rounded-2xl bg-gradient-to-br from-accent/30 via-primary/20 to-secondary/30 border border-primary/20 p-6">
            <div className="relative z-10 text-center">
              <h1 className="text-2xl font-bold">Events</h1>
              <p className="text-sm text-muted-foreground mt-1">Ongoing offers and prizes</p>
            </div>
          </div>

          <div className="space-y-4">
            {loading && <div className="text-sm text-muted-foreground text-center">Loading events...</div>}
            {!loading && events.length === 0 && (
              <Card className="p-6 text-center">
                <div className="text-sm text-muted-foreground">No events currently</div>
              </Card>
            )}
            {events.map((event) => (
              <Card key={event.id} className="overflow-hidden border bg-card/80 backdrop-blur-sm transition-all duration-300 hover:shadow-lg">
                <CardContent className="p-0">
                  <div className="flex items-stretch gap-3 p-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-base">{event.title}</h3>
                        <Badge className="bg-primary/10 text-primary border-primary/30">Active</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-3">{event.description}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                        <div className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          <span>Bolt Community</span>
                        </div>
                        <span>•</span>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{event.start_time ? new Date(event.start_time).toLocaleDateString() : 'Not specified'}</span>
                        </div>
                      </div>
                      <Button className="rounded-full px-4">Join Now</Button>
                    </div>
                    {event.image_url && (
                      <div className="w-20 h-20 rounded-xl overflow-hidden ml-auto">
                        <img src={event.image_url} alt={event.title} className="w-full h-full object-cover" loading="lazy" />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="mt-8 p-4 bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20">
            <div className="text-center">
              <Sparkles className="w-5 h-5 text-primary mx-auto mb-2" />
              <h3 className="font-semibold mb-1">Stay Informed!</h3>
              <p className="text-xs text-muted-foreground">
                New events are added daily. Make sure to follow continuously so you don't miss any opportunity!
              </p>
            </div>
          </Card>
        </div>
      </main>
    </>
  );
};

export default Events;
