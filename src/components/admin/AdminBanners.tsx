import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Plus, Trash2, Save, ArrowUp, ArrowDown } from 'lucide-react';

interface Banner {
  id: string;
  title: string;
  image_url: string | null;
  link_url: string | null;
  is_active: boolean;
  display_order: number;
}

const AdminBanners: React.FC = () => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [newBanner, setNewBanner] = useState({ title: '', image_url: '', link_url: '' });

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      const { data, error } = await supabase
        .from('promo_banners')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      setBanners(data || []);
    } catch (error) {
      console.error('Error fetching banners:', error);
    } finally {
      setLoading(false);
    }
  };

  const addBanner = async () => {
    if (!newBanner.title) {
      toast.error('Title is required');
      return;
    }

    try {
      const { error } = await supabase
        .from('promo_banners')
        .insert({
          title: newBanner.title,
          image_url: newBanner.image_url || null,
          link_url: newBanner.link_url || null,
          display_order: banners.length,
        });

      if (error) throw error;
      toast.success('Banner added');
      setNewBanner({ title: '', image_url: '', link_url: '' });
      fetchBanners();
    } catch (error) {
      console.error('Error adding banner:', error);
      toast.error('Failed to add banner');
    }
  };

  const updateBanner = async (id: string, updates: Partial<Banner>) => {
    try {
      const { error } = await supabase
        .from('promo_banners')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      toast.success('Banner updated');
      fetchBanners();
    } catch (error) {
      console.error('Error updating banner:', error);
      toast.error('Failed to update');
    }
  };

  const deleteBanner = async (id: string) => {
    try {
      const { error } = await supabase
        .from('promo_banners')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Banner deleted');
      fetchBanners();
    } catch (error) {
      console.error('Error deleting banner:', error);
      toast.error('Failed to delete');
    }
  };

  const moveOrder = async (id: string, direction: 'up' | 'down') => {
    const index = banners.findIndex(b => b.id === id);
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === banners.length - 1)
    ) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const targetBanner = banners[newIndex];
    const currentBanner = banners[index];

    await Promise.all([
      supabase.from('promo_banners').update({ display_order: newIndex }).eq('id', currentBanner.id),
      supabase.from('promo_banners').update({ display_order: index }).eq('id', targetBanner.id),
    ]);

    fetchBanners();
  };

  if (loading) {
    return <div className="p-4 text-center text-muted-foreground">Loading banners...</div>;
  }

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <h3 className="font-semibold mb-3">Add New Banner</h3>
        <div className="grid gap-3">
          <Input
            placeholder="Banner title"
            value={newBanner.title}
            onChange={(e) => setNewBanner(prev => ({ ...prev, title: e.target.value }))}
          />
          <Input
            placeholder="Image URL (optional)"
            value={newBanner.image_url}
            onChange={(e) => setNewBanner(prev => ({ ...prev, image_url: e.target.value }))}
          />
          <Input
            placeholder="Link URL (optional)"
            value={newBanner.link_url}
            onChange={(e) => setNewBanner(prev => ({ ...prev, link_url: e.target.value }))}
          />
          <Button onClick={addBanner} className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Add Banner
          </Button>
        </div>
      </Card>

      <div className="space-y-2">
        <h3 className="font-semibold">Active Banners ({banners.length})</h3>
        {banners.map((banner, index) => (
          <Card key={banner.id} className="p-3">
            <div className="flex items-center gap-3">
              <div className="flex flex-col gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => moveOrder(banner.id, 'up')}
                  disabled={index === 0}
                >
                  <ArrowUp className="w-3 h-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => moveOrder(banner.id, 'down')}
                  disabled={index === banners.length - 1}
                >
                  <ArrowDown className="w-3 h-3" />
                </Button>
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{banner.title}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {banner.image_url || 'No image'}
                </p>
              </div>

              <Switch
                checked={banner.is_active}
                onCheckedChange={(checked) => updateBanner(banner.id, { is_active: checked })}
              />

              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={() => deleteBanner(banner.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>

            {banner.image_url && (
              <div className="mt-2">
                <img 
                  src={banner.image_url} 
                  alt={banner.title}
                  className="w-full h-20 object-cover rounded"
                />
              </div>
            )}
          </Card>
        ))}

        {banners.length === 0 && (
          <p className="text-center text-muted-foreground py-4">No banners yet</p>
        )}
      </div>
    </div>
  );
};

export default AdminBanners;