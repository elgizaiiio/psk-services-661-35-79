import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Mail, Lock, User, Loader2, ArrowLeft, Sparkles } from 'lucide-react';
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
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
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
    const { error } = await signUp(email, password, firstName, lastName);
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/80 mb-4">
            <Sparkles className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">VIRAL Mining</h1>
          <p className="text-muted-foreground mt-1">ابدأ رحلة التعدين الآن</p>
        </div>

        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
          {showReset ? (
            <>
              <CardHeader>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowReset(false)}
                  className="w-fit -ml-2 mb-2"
                >
                  <ArrowLeft className="w-4 h-4 ml-1" />
                  رجوع
                </Button>
                <CardTitle>إعادة تعيين كلمة المرور</CardTitle>
                <CardDescription>
                  أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة التعيين
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reset-email">البريد الإلكتروني</Label>
                    <div className="relative">
                      <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="reset-email"
                        type="email"
                        placeholder="example@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pr-10"
                        dir="ltr"
                      />
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin ml-2" />
                    ) : null}
                    إرسال رابط إعادة التعيين
                  </Button>
                </form>
              </CardContent>
            </>
          ) : (
            <>
              <CardHeader className="pb-4">
                <CardTitle className="text-center">مرحباً بك</CardTitle>
                <CardDescription className="text-center">
                  سجل دخولك أو أنشئ حساب جديد
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'login' | 'signup')}>
                  <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="login">تسجيل الدخول</TabsTrigger>
                    <TabsTrigger value="signup">حساب جديد</TabsTrigger>
                  </TabsList>

                  <TabsContent value="login">
                    <form onSubmit={handleSignIn} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="login-email">البريد الإلكتروني</Label>
                        <div className="relative">
                          <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="login-email"
                            type="email"
                            placeholder="example@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="pr-10"
                            dir="ltr"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="login-password">كلمة المرور</Label>
                        <div className="relative">
                          <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="login-password"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="pr-10"
                            dir="ltr"
                          />
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="link"
                        className="px-0 text-sm"
                        onClick={() => setShowReset(true)}
                      >
                        نسيت كلمة المرور؟
                      </Button>
                      <Button type="submit" className="w-full" disabled={isSubmitting}>
                        {isSubmitting ? (
                          <Loader2 className="w-4 h-4 animate-spin ml-2" />
                        ) : null}
                        تسجيل الدخول
                      </Button>
                    </form>
                  </TabsContent>

                  <TabsContent value="signup">
                    <form onSubmit={handleSignUp} className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label htmlFor="first-name">الاسم الأول</Label>
                          <div className="relative">
                            <User className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                              id="first-name"
                              type="text"
                              placeholder="الاسم"
                              value={firstName}
                              onChange={(e) => setFirstName(e.target.value)}
                              className="pr-10"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="last-name">اسم العائلة</Label>
                          <Input
                            id="last-name"
                            type="text"
                            placeholder="العائلة"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-email">البريد الإلكتروني</Label>
                        <div className="relative">
                          <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="signup-email"
                            type="email"
                            placeholder="example@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="pr-10"
                            dir="ltr"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-password">كلمة المرور</Label>
                        <div className="relative">
                          <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="signup-password"
                            type="password"
                            placeholder="6 أحرف على الأقل"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="pr-10"
                            dir="ltr"
                          />
                        </div>
                      </div>
                      <Button type="submit" className="w-full" disabled={isSubmitting}>
                        {isSubmitting ? (
                          <Loader2 className="w-4 h-4 animate-spin ml-2" />
                        ) : null}
                        إنشاء حساب
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>

                {/* Telegram info */}
                <div className="mt-6 pt-4 border-t border-border">
                  <p className="text-sm text-center text-muted-foreground">
                    للوصول السريع، افتح التطبيق من خلال{' '}
                    <a 
                      href="https://t.me/ViralMiningBot" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      تليجرام بوت
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
