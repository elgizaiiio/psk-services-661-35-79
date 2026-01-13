import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, Trash2, ArrowUp, ArrowDown, Upload, Image, Link } from 'lucide-react';

interface Banner {
  id: string;
  title: string | null;
  image_url: string | null;
  link_url: string | null;
  internal_route: string | null;
  is_active: boolean;
  display_order: number;
}

const INTERNAL_ROUTES = [
  { value: '', label: 'No Navigation' },
  { value: '/mining-servers', label: 'Mining Servers' },
  { value: '/spin', label: 'Lucky Spin' },
  { value: '/daily-contest', label: '$100 Contest' },
  { value: '/leaderboard', label: 'Leaderboard' },
  { value: '/vip', label: 'VIP Subscription' },
  { value: '/invite', label: 'Invite Friends' },
  { value: '/tasks', label: 'Tasks' },
  { value: '/wallet', label: 'Wallet' },
  { value: '/profile', label: 'Profile' },
  { value: '/buy-bolt', label: 'Buy BOLT' },
  { value: '/token-store', label: 'Token Store' },
];

const AdminBanners: React.FC = () => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setUploading(true);

    try {
      // Upload to Supabase Storage
      const fileName = `banner_${Date.now()}_${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('banners')
        .upload(fileName, file);

      if (uploadError) {
        // If bucket doesn't exist, show helpful message
        if (uploadError.message.includes('Bucket not found')) {
          toast.error('Storage bucket not configured. Please add image URL manually.');
          return;
        }
        throw uploadError;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('banners')
        .getPublicUrl(fileName);

      // Create banner with image
      const { error: insertError } = await supabase
        .from('promo_banners')
        .insert({
          title: null,
          image_url: urlData.publicUrl,
          internal_route: null,
          link_url: null,
          display_order: banners.length,
        });

      if (insertError) throw insertError;

      toast.success('Banner added successfully');
      fetchBanners();
    } catch (error) {
      console.error('Error uploading banner:', error);
      toast.error('Failed to upload banner');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const addBannerFromUrl = async () => {
    const url = prompt('Enter image URL:');
    if (!url) return;

    try {
      const { error } = await supabase
        .from('promo_banners')
        .insert({
          title: null,
          image_url: url,
          internal_route: null,
          link_url: null,
          display_order: banners.length,
        });

      if (error) throw error;
      toast.success('Banner added');
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
    if (!confirm('Delete this banner?')) return;

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
      {/* Add New Banner */}
      <Card className="p-4">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Image className="w-4 h-4" />
          Add Banner
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              ref={fileInputRef}
              className="hidden"
            />
            <Button 
              onClick={() => fileInputRef.current?.click()} 
              className="w-full"
              disabled={uploading}
            >
              <Upload className="w-4 h-4 mr-2" />
              {uploading ? 'Uploading...' : 'Upload Image'}
            </Button>
          </div>
          <Button onClick={addBannerFromUrl} variant="outline" className="w-full">
            <Link className="w-4 h-4 mr-2" />
            From URL
          </Button>
        </div>
      </Card>

      {/* Banners List */}
      <div className="space-y-2">
        <h3 className="font-semibold">Banners ({banners.length})</h3>
        {banners.map((banner, index) => (
          <Card key={banner.id} className="p-3">
            <div className="flex items-start gap-3">
              {/* Order Controls */}
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
              
              {/* Banner Preview */}
              <div className="flex-1 space-y-3">
                {banner.image_url && (
                  <img 
                    src={banner.image_url} 
                    alt="Banner"
                    className="w-full h-20 object-cover rounded-lg"
                  />
                )}

                {/* Navigation Selection */}
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground">On Click Navigate To:</label>
                  <Select
                    value={banner.internal_route || ''}
                    onValueChange={(value) => updateBanner(banner.id, { 
                      internal_route: value || null 
                    })}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Select destination" />
                    </SelectTrigger>
                    <SelectContent>
                      {INTERNAL_ROUTES.map((route) => (
                        <SelectItem key={route.value} value={route.value || 'none'}>
                          {route.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* External URL (optional) */}
                <Input
                  placeholder="External URL (optional)"
                  value={banner.link_url || ''}
                  onChange={(e) => updateBanner(banner.id, { link_url: e.target.value || null })}
                  className="h-9 text-sm"
                />
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2">
                <Switch
                  checked={banner.is_active}
                  onCheckedChange={(checked) => updateBanner(banner.id, { is_active: checked })}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive h-8 w-8 p-0"
                  onClick={() => deleteBanner(banner.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
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