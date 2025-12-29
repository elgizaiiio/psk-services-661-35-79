import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { z } from 'zod';

// Validation schemas
const emailSchema = z.string().email('البريد الإلكتروني غير صالح');
const passwordSchema = z.string().min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل');

const Auth = () => {
  const navigate = useNavigate();
  const { user, isLoading, isTelegramApp, signIn, signUp, resetPassword } = useAuth();
  
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showReset, setShowReset] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (user && !isLoading) {
      navigate('/');
    }
  }, [user, isLoading, navigate]);

  // Redirect Telegram users
  useEffect(() => {
    if (isTelegramApp) {
      navigate('/');
    }
  }, [isTelegramApp, navigate]);

  const validateForm = () => {
    try {
      emailSchema.parse(email);
      passwordSchema.parse(password);
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      }
      return false;
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    const { error } = await signIn(email, password);
    setIsSubmitting(false);

    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        toast.error('بيانات الدخول غير صحيحة');
      } else {
        toast.error(error.message);
      }
    } else {
      toast.success('تم تسجيل الدخول بنجاح');
      navigate('/');
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    const { error } = await signUp(email, password, name);
    setIsSubmitting(false);

    if (error) {
      if (error.message.includes('already registered')) {
        toast.error('هذا البريد مسجل بالفعل');
      } else {
        toast.error(error.message);
      }
    } else {
      toast.success('تم إنشاء الحساب بنجاح!');
      navigate('/');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      emailSchema.parse(email);
    } catch {
      toast.error('البريد الإلكتروني غير صالح');
      return;
    }

    setIsSubmitting(true);
    const { error } = await resetPassword(email);
    setIsSubmitting(false);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('تم إرسال رابط إعادة تعيين كلمة المرور');
      setShowReset(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-sm">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-4">
            <span className="text-4xl font-bold text-primary">V</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">VIRAL Mining</h1>
          <p className="text-muted-foreground text-sm mt-2">ابدأ رحلة التعدين الآن</p>
        </div>

        <Card className="border-0 bg-card/50 backdrop-blur-sm shadow-xl">
          {showReset ? (
            <>
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-lg">إعادة تعيين كلمة المرور</CardTitle>
                <CardDescription>
                  أدخل بريدك الإلكتروني لإرسال رابط إعادة التعيين
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reset-email">البريد الإلكتروني</Label>
                    <Input
                      id="reset-email"
                      type="email"
                      placeholder="example@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-12 text-base"
                      dir="ltr"
                    />
                  </div>
                  <Button type="submit" className="w-full h-12 text-base" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="w-4 h-4 animate-spin ml-2" />}
                    إرسال الرابط
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full"
                    onClick={() => setShowReset(false)}
                  >
                    رجوع
                  </Button>
                </form>
              </CardContent>
            </>
          ) : (
            <>
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-lg">مرحباً بك</CardTitle>
              </CardHeader>
              <CardContent className="pt-2">
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'login' | 'signup')}>
                  <TabsList className="grid w-full grid-cols-2 mb-6 h-12">
                    <TabsTrigger value="login" className="text-base">دخول</TabsTrigger>
                    <TabsTrigger value="signup" className="text-base">حساب جديد</TabsTrigger>
                  </TabsList>

                  <TabsContent value="login" className="space-y-4">
                    <form onSubmit={handleSignIn} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="login-email">البريد الإلكتروني</Label>
                        <Input
                          id="login-email"
                          type="email"
                          placeholder="example@email.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="h-12 text-base"
                          dir="ltr"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="login-password">كلمة المرور</Label>
                        <Input
                          id="login-password"
                          type="password"
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="h-12 text-base"
                          dir="ltr"
                        />
                      </div>
                      <div className="text-left">
                        <Button
                          type="button"
                          variant="link"
                          className="px-0 text-sm text-muted-foreground"
                          onClick={() => setShowReset(true)}
                        >
                          نسيت كلمة المرور؟
                        </Button>
                      </div>
                      <Button type="submit" className="w-full h-12 text-base" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="w-4 h-4 animate-spin ml-2" />}
                        تسجيل الدخول
                      </Button>
                    </form>
                  </TabsContent>

                  <TabsContent value="signup" className="space-y-4">
                    <form onSubmit={handleSignUp} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">الاسم</Label>
                        <Input
                          id="name"
                          type="text"
                          placeholder="اسمك"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="h-12 text-base"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-email">البريد الإلكتروني</Label>
                        <Input
                          id="signup-email"
                          type="email"
                          placeholder="example@email.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="h-12 text-base"
                          dir="ltr"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-password">كلمة المرور</Label>
                        <Input
                          id="signup-password"
                          type="password"
                          placeholder="6 أحرف على الأقل"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="h-12 text-base"
                          dir="ltr"
                        />
                      </div>
                      <Button type="submit" className="w-full h-12 text-base" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="w-4 h-4 animate-spin ml-2" />}
                        إنشاء حساب
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>

                {/* Telegram info */}
                <div className="mt-6 pt-4 border-t border-border/50">
                  <p className="text-xs text-center text-muted-foreground">
                    للدخول السريع استخدم{' '}
                    <a 
                      href="https://t.me/ViralMiningBot" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline font-medium"
                    >
                      تليجرام
                    </a>
                  </p>
                </div>
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Auth;
