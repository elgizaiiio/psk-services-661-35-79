import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Plus, Trash2, ArrowUp, ArrowDown, Save, Image, Loader2 } from 'lucide-react';

interface HomeSection {
  id: string;
  image_url: string;
  internal_route: string;
  display_order: number;
  layout_type: 'rectangle' | 'square';
  is_active: boolean;
}

const AVAILABLE_ROUTES = [
  { value: '/mining-servers', label: 'Mining Servers' },
  { value: '/vip', label: 'VIP Subscription' },
  { value: '/contest', label: '$10K Referral Contest' },
  { value: '/spin', label: 'Lucky Spin' },
  { value: '/leaderboard', label: 'Leaderboard' },
  { value: '/server-store', label: 'Server Store' },
  { value: '/daily-contest', label: 'Daily Contest' },
  { value: '/buy-bolt', label: 'Buy BOLT' },
  { value: '/achievements', label: 'Achievements' },
  { value: '/challenges', label: 'Challenges' },
  { value: '/apps', label: 'Games & Apps' },
  { value: '/premium-packages', label: 'Premium Packages' },
];

const AdminHomeSections: React.FC = () => {
  const [sections, setSections] = useState<HomeSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newSection, setNewSection] = useState({
    image_url: '',
    internal_route: '/mining-servers',
    layout_type: 'square' as 'rectangle' | 'square',
  });

  const fetchSections = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('home_sections' as any)
      .select('*')
      .order('display_order', { ascending: true });
    
    if (error) {
      toast.error('Failed to load sections');
    } else {
      setSections((data || []) as HomeSection[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSections();
  }, []);

  const handleAddSection = async () => {
    if (!newSection.image_url) {
      toast.error('Please enter an image URL');
      return;
    }

    setSaving(true);
    const maxOrder = sections.length > 0 ? Math.max(...sections.map(s => s.display_order)) : 0;
    
    const { error } = await supabase
      .from('home_sections' as any)
      .insert({
        image_url: newSection.image_url,
        internal_route: newSection.internal_route,
        layout_type: newSection.layout_type,
        display_order: maxOrder + 1,
        is_active: true,
      });

    if (error) {
      toast.error('Failed to add section');
    } else {
      toast.success('Section added successfully');
      setNewSection({ image_url: '', internal_route: '/mining-servers', layout_type: 'square' });
      fetchSections();
    }
    setSaving(false);
  };

  const handleUpdateSection = async (id: string, updates: Partial<HomeSection>) => {
    const { error } = await supabase
      .from('home_sections' as any)
      .update(updates)
      .eq('id', id);

    if (error) {
      toast.error('Failed to update section');
    } else {
      setSections(sections.map(s => s.id === id ? { ...s, ...updates } : s));
      toast.success('Section updated');
    }
  };

  const handleDeleteSection = async (id: string) => {
    if (!confirm('Are you sure you want to delete this section?')) return;

    const { error } = await supabase
      .from('home_sections' as any)
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete section');
    } else {
      toast.success('Section deleted');
      fetchSections();
    }
  };

  const handleMoveSection = async (id: string, direction: 'up' | 'down') => {
    const index = sections.findIndex(s => s.id === id);
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === sections.length - 1)) {
      return;
    }

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const newSections = [...sections];
    [newSections[index], newSections[newIndex]] = [newSections[newIndex], newSections[index]];

    // Update display_order for both sections
    const updates = newSections.map((s, i) => ({
      id: s.id,
      display_order: i + 1,
    }));

    for (const update of updates) {
      await supabase
        .from('home_sections' as any)
        .update({ display_order: update.display_order })
        .eq('id', update.id);
    }

    setSections(newSections.map((s, i) => ({ ...s, display_order: i + 1 })));
    toast.success('Order updated');
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, sectionId?: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileExt = file.name.split('.').pop();
    const fileName = `home-section-${Date.now()}.${fileExt}`;
    const filePath = `home-sections/${fileName}`;

    const { error: uploadError, data } = await supabase.storage
      .from('public')
      .upload(filePath, file);

    if (uploadError) {
      toast.error('Failed to upload image');
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from('public').getPublicUrl(filePath);

    if (sectionId) {
      handleUpdateSection(sectionId, { image_url: publicUrl });
    } else {
      setNewSection({ ...newSection, image_url: publicUrl });
    }
    toast.success('Image uploaded');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Home Page Sections</h2>
          <p className="text-sm text-muted-foreground">Manage image-based navigation sections</p>
        </div>
        <Button onClick={fetchSections} variant="outline" size="sm">
          Refresh
        </Button>
      </div>

      {/* Add New Section */}
      <Card className="p-4 space-y-4">
        <h3 className="font-medium flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add New Section
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label>Image URL</Label>
            <div className="flex gap-2">
              <Input
                placeholder="https://..."
                value={newSection.image_url}
                onChange={(e) => setNewSection({ ...newSection, image_url: e.target.value })}
              />
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleImageUpload(e)}
                />
                <Button type="button" variant="outline" size="icon" asChild>
                  <span><Image className="w-4 h-4" /></span>
                </Button>
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Target Page</Label>
            <Select
              value={newSection.internal_route}
              onValueChange={(value) => setNewSection({ ...newSection, internal_route: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AVAILABLE_ROUTES.map((route) => (
                  <SelectItem key={route.value} value={route.value}>
                    {route.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Layout Type</Label>
            <Select
              value={newSection.layout_type}
              onValueChange={(value: 'rectangle' | 'square') => setNewSection({ ...newSection, layout_type: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rectangle">Rectangle (Full Width)</SelectItem>
                <SelectItem value="square">Square (Grid)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end">
            <Button onClick={handleAddSection} disabled={saving} className="w-full">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
              Add Section
            </Button>
          </div>
        </div>

        {newSection.image_url && (
          <div className="w-32 h-32 rounded-lg overflow-hidden border border-border">
            <img src={newSection.image_url} alt="Preview" className="w-full h-full object-cover" />
          </div>
        )}
      </Card>

      {/* Existing Sections */}
      <div className="space-y-3">
        <h3 className="font-medium">Current Sections ({sections.length})</h3>
        
        {sections.map((section, index) => (
          <Card key={section.id} className="p-4">
            <div className="flex items-center gap-4">
              {/* Preview Image */}
              <div className="w-20 h-20 rounded-lg overflow-hidden border border-border shrink-0">
                <img src={section.image_url} alt="" className="w-full h-full object-cover" />
              </div>

              {/* Section Details */}
              <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Image URL</Label>
                  <div className="flex gap-1">
                    <Input
                      value={section.image_url}
                      onChange={(e) => handleUpdateSection(section.id, { image_url: e.target.value })}
                      className="text-xs"
                    />
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleImageUpload(e, section.id)}
                      />
                      <Button type="button" variant="outline" size="icon" className="h-9 w-9" asChild>
                        <span><Image className="w-3 h-3" /></span>
                      </Button>
                    </label>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Target Page</Label>
                  <Select
                    value={section.internal_route}
                    onValueChange={(value) => handleUpdateSection(section.id, { internal_route: value })}
                  >
                    <SelectTrigger className="text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {AVAILABLE_ROUTES.map((route) => (
                        <SelectItem key={route.value} value={route.value}>
                          {route.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Layout</Label>
                  <Select
                    value={section.layout_type}
                    onValueChange={(value: 'rectangle' | 'square') => handleUpdateSection(section.id, { layout_type: value })}
                  >
                    <SelectTrigger className="text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rectangle">Rectangle</SelectItem>
                      <SelectItem value="square">Square</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                <div className="flex items-center gap-2">
                  <Label className="text-xs">Active</Label>
                  <Switch
                    checked={section.is_active}
                    onCheckedChange={(checked) => handleUpdateSection(section.id, { is_active: checked })}
                  />
                </div>
                
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleMoveSection(section.id, 'up')}
                  disabled={index === 0}
                >
                  <ArrowUp className="w-4 h-4" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleMoveSection(section.id, 'down')}
                  disabled={index === sections.length - 1}
                >
                  <ArrowDown className="w-4 h-4" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeleteSection(section.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}

        {sections.length === 0 && (
          <Card className="p-8 text-center text-muted-foreground">
            No sections added yet. Add your first section above.
          </Card>
        )}
      </div>
    </div>
  );
};

export default AdminHomeSections;
