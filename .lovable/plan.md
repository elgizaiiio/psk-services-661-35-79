
# خطة تحسين الأداء لاستيعاب أكثر من مليون مستخدم

## الوضع الحالي

### إحصائيات قاعدة البيانات:
- **122,713** مستخدم في جدول `bolt_users`
- **106,825** سجل في جدول `notification_queue`
- **11,445** مشاهدة إعلان
- **8,135** مهمة مكتملة

### المشاكل المكتشفة:

1. **عدم استخدام React Query بشكل صحيح**
   - الـ hooks تستخدم `useState` و `useEffect` يدوياً بدلاً من React Query
   - كل صفحة تجلب البيانات من جديد عند كل زيارة
   - لا يوجد caching فعال للبيانات

2. **طلبات API متكررة**
   - `useBoltMining` يستدعي الـ API مع كل render
   - `useTelegramAuth` يعيد التهيئة عند كل mount
   - كل hook يجلب بيانات المستخدم بشكل منفصل

3. **Polling مكثف**
   - أكثر من 25 `setInterval` في التطبيق
   - بعضها يعمل كل ثانية (1000ms)
   - استهلاك كبير للـ CPU والباندويث

4. **عدم وجود batching للعمليات**
   - كل عملية تنفذ queries متعددة بشكل منفصل
   - مثال: إكمال مهمة يتطلب 4 queries منفصلة

---

## خطة التحسين

### المرحلة 1: تحسين Client-Side Caching

**1. إنشاء User Context مركزي**
```
src/contexts/UserContext.tsx
```
- سيحتفظ ببيانات المستخدم في مكان واحد
- جميع الـ hooks ستقرأ من هذا الـ Context
- تقليل الـ API calls من 10+ إلى 1 فقط

**2. استخدام React Query بشكل صحيح**
```
src/hooks/useUserData.ts
```
- `staleTime: 5 minutes` - البيانات تبقى صالحة 5 دقائق
- `gcTime: 30 minutes` - البيانات تبقى في الذاكرة 30 دقيقة
- تحديث تلقائي عند العودة للتطبيق

**3. تقليل الـ Polling**
- تغيير فترات الـ `setInterval`:
  - Mining progress: من 1 ثانية إلى 5 ثواني
  - TON price: من 5 دقائق إلى 15 دقيقة
  - Lives calculation: من 1 دقيقة إلى 5 دقائق

---

### المرحلة 2: تحسين Backend

**1. إنشاء Edge Function موحدة للبيانات**
```
supabase/functions/get-user-dashboard/index.ts
```
```text
+------------------+
|   get-user-dashboard   |
+------------------+
         |
         v
+------------------+     +------------------+
|  User Data       | --> |  Mining Session  |
+------------------+     +------------------+
         |                        |
         v                        v
+------------------+     +------------------+
|  Tasks Status    | --> |  Streak Data     |
+------------------+     +------------------+
```
- إرجاع جميع البيانات في طلب واحد
- تقليل الـ roundtrips من 6 إلى 1

**2. تحسين جداول قاعدة البيانات**

إضافة Indexes:
```sql
CREATE INDEX CONCURRENTLY idx_bolt_users_telegram_id 
ON bolt_users(telegram_id);

CREATE INDEX CONCURRENTLY idx_completed_tasks_user_id 
ON bolt_completed_tasks(user_id);

CREATE INDEX CONCURRENTLY idx_mining_sessions_active 
ON bolt_mining_sessions(user_id, is_active) 
WHERE is_active = true;
```

**3. إضافة Database Function للـ Batching**
```sql
CREATE FUNCTION get_user_complete_data(p_telegram_id bigint)
RETURNS jsonb
```
- تجمع كل البيانات في query واحد
- أسرع 10x من queries منفصلة

---

### المرحلة 3: تحسين إضافي

**1. Lazy Loading للبيانات الثانوية**
- تحميل المهام فقط عند زيارة صفحة Tasks
- تحميل الـ Referrals فقط عند زيارة صفحة Invite

**2. تنظيف جدول notification_queue**
- الجدول يحتوي 106,825 سجل
- إضافة cleanup job يومي لحذف القديم

**3. Rate Limiting على Edge Functions**
- منع المستخدم من إرسال أكثر من 10 طلبات/دقيقة

---

## التفاصيل التقنية

### الملفات الجديدة:
1. `src/contexts/UserContext.tsx` - Context مركزي
2. `src/hooks/useUserData.ts` - Hook موحد للبيانات
3. `supabase/functions/get-user-dashboard/index.ts` - Edge Function موحدة

### الملفات المعدلة:
1. `src/App.tsx` - إضافة UserProvider
2. `src/hooks/useBoltMining.ts` - استخدام UserContext
3. `src/hooks/useBoltTasks.ts` - استخدام UserContext
4. `src/hooks/useDailyStreak.ts` - استخدام UserContext
5. `src/pages/Index.tsx` - تقليل الـ re-renders

### التحسين المتوقع:
| القياس | الحالي | بعد التحسين |
|--------|--------|-------------|
| API calls لكل مستخدم/دقيقة | ~60 | ~5 |
| Database queries/session | ~50 | ~10 |
| Memory usage | عالي | منخفض 70% |
| استيعاب المستخدمين | 150K | 1M+ |

---

## ✅ التحسينات المنفذة

### المرحلة 1: Client-Side Caching ✅
- [x] إنشاء `src/contexts/UserContext.tsx` - Context مركزي مع React Query
- [x] إنشاء `src/hooks/useUserData.ts` - Hooks موحدة للبيانات
- [x] تحديث `useDailyStreak.ts` لاستخدام Context
- [x] تحديث `useBoltTasks.ts` لاستخدام Context
- [x] تقليل mining polling من 1 ثانية إلى 5 ثواني

### المرحلة 2: Backend ✅
- [x] إنشاء `get-user-dashboard` Edge Function موحدة
- [x] إضافة Database Indexes:
  - `idx_bolt_users_telegram_id`
  - `idx_completed_tasks_user_id`
  - `idx_mining_sessions_active`
  - `idx_daily_login_rewards_user_date`
  - `idx_bolt_town_daily_points_user_date`
  - `idx_bolt_tasks_active`
  - `idx_notification_queue_created_at`
  - `idx_bolt_referrals_referrer`
  - `idx_ad_views_user_created`

### الخطوات المتبقية
- [ ] تنظيف جدول notification_queue
- [ ] إضافة Rate Limiting على Edge Functions
