import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, ArrowUp, ArrowDown, Image, Loader2, Shield, ArrowLeft, Upload, RefreshCw, Info } from 'lucide-react';
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { isAdmin } from '@/lib/admin-constants';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface HomeSection {
  id: string;
  image_url: string;
  internal_route: string;
  display_order: number;
  layout_type: 'rectangle' | 'square';
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

const AVAILABLE_ROUTES = [
  { value: '/mining-servers', label: 'Mining Servers', icon: '⛏️' },
  { value: '/vip', label: 'VIP Subscription', icon: '👑' },
  { value: '/contest', label: '$10K Referral Contest', icon: '🏆' },
  { value: '/spin', label: 'Lucky Spin', icon: '🎰' },
  { value: '/leaderboard', label: 'Leaderboard', icon: '📊' },
  { value: '/server-store', label: 'Server Store', icon: '🛒' },
  { value: '/daily-contest', label: 'Daily Contest', icon: '📅' },
  { value: '/buy-bolt', label: 'Buy BOLT', icon: '⚡' },
  { value: '/achievements', label: 'Achievements', icon: '🎖️' },
  { value: '/challenges', label: 'Challenges', icon: '🎯' },
  { value: '/apps', label: 'Games & Apps', icon: '🎮' },
  { value: '/premium-packages', label: 'Premium Packages', icon: '💎' },
  { value: '/tasks', label: 'Tasks', icon: '✅' },
  { value: '/invite', label: 'Invite Friends', icon: '👥' },
  { value: '/wallet', label: 'Wallet', icon: '💰' },
];

const IMAGE_SIZE_INFO = {
  rectangle: { width: '800-1200px', height: '400-600px', ratio: '2:1' },
  square: { width: '400-600px', height: '400-600px', ratio: '1:1' },
};

const AdminHomeSectionsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user: telegramUser, isLoading: authLoading } = useTelegramAuth();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  const [sections, setSections] = useState<HomeSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  
  const [newSection, setNewSection] = useState({
    image_url: '',
    internal_route: '/mining-servers',
    layout_type: 'square' as 'rectangle' | 'square',
  });

  // Check admin access
  useEffect(() => {
    if (!authLoading && telegramUser) {
      const hasAccess = isAdmin(telegramUser.id);
      setIsAuthenticated(hasAccess);
      
      if (!hasAccess) {
        toast.error('Access denied. Admin only.');
        navigate('/');
      }
    }
  }, [telegramUser, authLoading, navigate]);

  const fetchSections = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('home_sections' as any)
        .select('*')
        .order('display_order', { ascending: true });
      
      if (error) {
        console.error('Error fetching sections:', error);
        toast.error('فشل في تحميل الأقسام');
      } else {
        setSections((data || []) as unknown as HomeSection[]);
      }
    } catch (err) {
      console.error('Exception fetching sections:', err);
      toast.error('حدث خطأ غير متوقع');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchSections();
    }
  }, [isAuthenticated]);

  const handleAddSection = async () => {
    if (!newSection.image_url) {
      toast.error('الرجاء إدخال رابط الصورة أو رفع صورة');
      return;
    }

    setSaving(true);
    try {
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
        console.error('Error adding section:', error);
        toast.error('فشل في إضافة القسم');
      } else {
        toast.success('تم إضافة القسم بنجاح');
        setNewSection({ image_url: '', internal_route: '/mining-servers', layout_type: 'square' });
        fetchSections();
      }
    } catch (err) {
      console.error('Exception adding section:', err);
      toast.error('حدث خطأ غير متوقع');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateSection = async (id: string, updates: Partial<HomeSection>) => {
    try {
      const { error } = await supabase
        .from('home_sections' as any)
        .update(updates)
        .eq('id', id);

      if (error) {
        console.error('Error updating section:', error);
        toast.error('فشل في تحديث القسم');
      } else {
        setSections(sections.map(s => s.id === id ? { ...s, ...updates } : s));
        toast.success('تم تحديث القسم');
      }
    } catch (err) {
      console.error('Exception updating section:', err);
      toast.error('حدث خطأ غير متوقع');
    }
  };

  const handleDeleteSection = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا القسم؟')) return;

    try {
      const { error } = await supabase
        .from('home_sections' as any)
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting section:', error);
        toast.error('فشل في حذف القسم');
      } else {
        toast.success('تم حذف القسم');
        fetchSections();
      }
    } catch (err) {
      console.error('Exception deleting section:', err);
      toast.error('حدث خطأ غير متوقع');
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

    // Update locally first for instant feedback
    setSections(newSections.map((s, i) => ({ ...s, display_order: i + 1 })));

    // Update in database
    try {
      for (let i = 0; i < newSections.length; i++) {
        await supabase
          .from('home_sections' as any)
          .update({ display_order: i + 1 })
          .eq('id', newSections[i].id);
      }
      toast.success('تم تحديث الترتيب');
    } catch (err) {
      console.error('Error updating order:', err);
      toast.error('فشل في تحديث الترتيب');
      fetchSections(); // Revert on error
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, sectionId?: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('الرجاء اختيار ملف صورة صالح');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('حجم الصورة يجب أن يكون أقل من 5MB');
      return;
    }

    setUploadingId(sectionId || 'new');
    const loadingToast = toast.loading('جاري رفع الصورة...');

    try {
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `section-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('home-images')
        .upload(fileName, file, { 
          upsert: true,
          cacheControl: '3600',
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        toast.error('فشل في رفع الصورة: ' + uploadError.message, { id: loadingToast });
        return;
      }

      const { data: { publicUrl } } = supabase.storage.from('home-images').getPublicUrl(fileName);

      if (sectionId) {
        await handleUpdateSection(sectionId, { image_url: publicUrl });
      } else {
        setNewSection(prev => ({ ...prev, image_url: publicUrl }));
      }
      
      toast.success('تم رفع الصورة بنجاح', { id: loadingToast });
    } catch (err) {
      console.error('Exception uploading:', err);
      toast.error('حدث خطأ أثناء رفع الصورة', { id: loadingToast });
    } finally {
      setUploadingId(null);
    }
  };

  // Loading state
  if (authLoading || (!isAuthenticated && !authLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Shield className="w-16 h-16 mx-auto text-primary animate-pulse" />
          <div className="text-xl font-bold">Admin Access</div>
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/50">
      <Helmet>
        <title>إدارة أقسام الصفحة الرئيسية | BOLT Admin</title>
      </Helmet>
      
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">إدارة أقسام الصفحة الرئيسية</h1>
              <p className="text-sm text-muted-foreground">إضافة وتعديل الصور في الصفحة الرئيسية</p>
            </div>
          </div>
          <Button onClick={fetchSections} variant="outline" size="sm" disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            تحديث
          </Button>
        </div>

        {/* Image Size Info */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div className="space-y-2 text-sm">
                <p className="font-medium">أحجام الصور المُوصى بها:</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Badge variant="outline" className="mb-1">مستطيل (Rectangle)</Badge>
                    <p className="text-muted-foreground">
                      الأبعاد: {IMAGE_SIZE_INFO.rectangle.width} × {IMAGE_SIZE_INFO.rectangle.height}
                      <br />
                      النسبة: {IMAGE_SIZE_INFO.rectangle.ratio}
                    </p>
                  </div>
                  <div>
                    <Badge variant="outline" className="mb-1">مربع (Square)</Badge>
                    <p className="text-muted-foreground">
                      الأبعاد: {IMAGE_SIZE_INFO.square.width} × {IMAGE_SIZE_INFO.square.height}
                      <br />
                      النسبة: {IMAGE_SIZE_INFO.square.ratio}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Add New Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Plus className="w-5 h-5 text-primary" />
              إضافة قسم جديد
            </CardTitle>
            <CardDescription>أضف صورة جديدة للصفحة الرئيسية</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Image Upload */}
            <div className="space-y-2">
              <Label>الصورة</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="https://... أو ارفع صورة"
                  value={newSection.image_url}
                  onChange={(e) => setNewSection({ ...newSection, image_url: e.target.value })}
                  className="flex-1"
                />
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleImageUpload(e)}
                    disabled={uploadingId === 'new'}
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    disabled={uploadingId === 'new'}
                    asChild
                  >
                    <span className="flex items-center gap-2">
                      {uploadingId === 'new' ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4" />
                      )}
                      رفع
                    </span>
                  </Button>
                </label>
              </div>
              
              {/* Preview */}
              {newSection.image_url && (
                <div className="mt-2 rounded-lg overflow-hidden border border-border w-40 h-40">
                  <img 
                    src={newSection.image_url} 
                    alt="معاينة" 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/placeholder.svg';
                    }}
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Target Page */}
              <div className="space-y-2">
                <Label>الصفحة المستهدفة</Label>
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
                        <span className="flex items-center gap-2">
                          <span>{route.icon}</span>
                          <span>{route.label}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Layout Type */}
              <div className="space-y-2">
                <Label>نوع التخطيط</Label>
                <Select
                  value={newSection.layout_type}
                  onValueChange={(value: 'rectangle' | 'square') => setNewSection({ ...newSection, layout_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rectangle">مستطيل (عرض كامل)</SelectItem>
                    <SelectItem value="square">مربع (شبكة)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button onClick={handleAddSection} disabled={saving || !newSection.image_url} className="w-full">
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              إضافة القسم
            </Button>
          </CardContent>
        </Card>

        <Separator />

        {/* Existing Sections */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">الأقسام الحالية ({sections.length})</h2>
          </div>
          
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : sections.length === 0 ? (
            <Card className="p-8 text-center">
              <Image className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">لا توجد أقسام بعد. أضف القسم الأول أعلاه.</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {sections.map((section, index) => (
                <Card key={section.id} className={`transition-all ${!section.is_active ? 'opacity-60' : ''}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      {/* Preview Image */}
                      <div className="w-24 h-24 rounded-lg overflow-hidden border border-border shrink-0 bg-muted">
                        <img 
                          src={section.image_url} 
                          alt="" 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/placeholder.svg';
                          }}
                        />
                      </div>

                      {/* Section Details */}
                      <div className="flex-1 space-y-3">
                        {/* Image URL */}
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">رابط الصورة</Label>
                          <div className="flex gap-2">
                            <Input
                              value={section.image_url}
                              onChange={(e) => handleUpdateSection(section.id, { image_url: e.target.value })}
                              className="text-sm"
                              dir="ltr"
                            />
                            <label className="cursor-pointer">
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => handleImageUpload(e, section.id)}
                                disabled={uploadingId === section.id}
                              />
                              <Button 
                                type="button" 
                                variant="outline" 
                                size="icon"
                                disabled={uploadingId === section.id}
                                asChild
                              >
                                <span>
                                  {uploadingId === section.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <Upload className="w-4 h-4" />
                                  )}
                                </span>
                              </Button>
                            </label>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          {/* Target Page */}
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">الصفحة المستهدفة</Label>
                            <Select
                              value={section.internal_route}
                              onValueChange={(value) => handleUpdateSection(section.id, { internal_route: value })}
                            >
                              <SelectTrigger className="text-sm">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {AVAILABLE_ROUTES.map((route) => (
                                  <SelectItem key={route.value} value={route.value}>
                                    <span className="flex items-center gap-2">
                                      <span>{route.icon}</span>
                                      <span>{route.label}</span>
                                    </span>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Layout Type */}
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">نوع التخطيط</Label>
                            <Select
                              value={section.layout_type}
                              onValueChange={(value: 'rectangle' | 'square') => handleUpdateSection(section.id, { layout_type: value })}
                            >
                              <SelectTrigger className="text-sm">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="rectangle">مستطيل</SelectItem>
                                <SelectItem value="square">مربع</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col items-center gap-2 shrink-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Label className="text-xs">نشط</Label>
                          <Switch
                            checked={section.is_active}
                            onCheckedChange={(checked) => handleUpdateSection(section.id, { is_active: checked })}
                          />
                        </div>
                        
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleMoveSection(section.id, 'up')}
                            disabled={index === 0}
                            className="h-8 w-8"
                          >
                            <ArrowUp className="w-4 h-4" />
                          </Button>
                          
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleMoveSection(section.id, 'down')}
                            disabled={index === sections.length - 1}
                            className="h-8 w-8"
                          >
                            <ArrowDown className="w-4 h-4" />
                          </Button>
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteSection(section.id)}
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Order badge */}
                    <div className="mt-2 flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        الترتيب: {section.display_order}
                      </Badge>
                      <Badge variant={section.layout_type === 'rectangle' ? 'default' : 'outline'} className="text-xs">
                        {section.layout_type === 'rectangle' ? 'مستطيل' : 'مربع'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminHomeSectionsPage;
