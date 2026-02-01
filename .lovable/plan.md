
## الهدف
إصلاح 3 مشاكل مرتبطة ببعض:
1) صفحة Bolt Town لا تعرض نقاطك ولا المتصدرين لأن النقاط لا يتم تسجيلها أصلاً.
2) صفحة مسابقة الإحالة (Contest) الإحصائيات فيها “ثابتة/غير صحيحة” لأن روابط الإحالة الحالية لا تُفهم من الباك‑إند + تحديثات العدّاد/البيانات تعتمد على وقت الجهاز.
3) فشل النشر (Publishing failed) غالبًا بسبب مشكلة بناء Production مرتبطة بالاعتماد على مكتبة حركة غير موجودة في dependencies.

---

## التشخيص (Root Causes) — لماذا لا يوجد أي بيانات؟
### A) عمود `total_points` في `bolt_town_daily_points` محسوب من الباك‑إند (Generated)
قاعدة البيانات عندك مُعرّفة بحيث `total_points` **Generated ALWAYS** من باقي الأعمدة:
- referral_points + referral_bonus_points + task_points + special_task_points + ad_points + activity_points + streak_bonus

وهذا يعني:
- **ممنوع** `INSERT` بقيمة لـ `total_points`
- **ممنوع** `UPDATE` لـ `total_points`

والكود الحالي في أكثر من مكان يحاول يعمل:
- insert `{ total_points: 0 }`
- update `{ total_points: compute(...) }`

فبالتالي عمليات إنشاء سجل اليوم + تحديث النقاط تفشل بصمت → النتيجة: لا تظهر نقاط ولا ليدر بورد.

أماكن مؤكدة فيها هذا الخطأ:
- `src/hooks/useBoltTown.ts` (insert/update total_points)
- `src/hooks/useBoltTasks.ts` (helper يكتب total_points)
- `src/hooks/useDailyTasks.ts` (helper يكتب total_points)
- `src/components/ads/WatchAdCard.tsx` (helper يكتب total_points)
- `src/hooks/useBoltMining.ts` (helper يكتب total_points)
- `src/hooks/useUserServers.ts` (بعد شراء سيرفر يكتب total_points)
- `supabase/functions/telegram-webhook/index.ts` (يكتب total_points عند إضافة نقاط الإحالة)
- `supabase/functions/process-referral/index.ts` (نفس المشكلة، حتى لو غير مستخدم حاليًا)

### B) روابط الإحالة في صفحة Contest ليست متوافقة مع parsing في الباك‑إند
في `src/pages/Contest.tsx` الرابط الحالي:
`start=ref_${tgUser.id}`

لكن في `telegram-webhook` الباك‑إند يحاول يفسر referralCode كـ:
- username (نص عادي) أو
- رقم telegram_id (رقم فقط)

`ref_12345` لا يُطابق username ولا يُمكن تحويله لرقم → referrer لا يتم العثور عليه → لا يتم إنشاء referral → لا تتغير contest_participants → الإحصائيات “ثابتة”.

### C) فشل النشر Production غالبًا بسبب `framer-motion`
المشروع يستخدم `import { motion } from 'framer-motion'` في عشرات الملفات، لكن `package.json` لا يحتوي `framer-motion` (يوجد `motion` فقط).
هذا يسبب فشل بناء Production.

---

## الخطة التنفيذية (Implementation Steps)

### 1) إصلاح فشل النشر (Production build)
أحد حلّين (سنختار الأقل مخاطرة):
- **إضافة dependency**: إضافة `framer-motion` إلى `package.json` (مع الإبقاء على `motion` لأنه مستخدم في أجزاء أخرى).
- (بديل أكبر): تحويل كل imports من `framer-motion` إلى `motion/react` (لكن هذا تعديل على 70+ ملف، مخاطرة أعلى).

**النتيجة المتوقعة:** النشر ينجح بدل رسالة “Publishing failed”.

---

### 2) إصلاح نظام نقاط Bolt Town بشكل جذري (عدم كتابة total_points)
سنقوم بتعديل كل أماكن إدخال/تحديث نقاط Bolt Town لكي:
- لا يرسلوا `total_points` في insert
- ولا يرسلوا `total_points` في update

بدل ذلك:
- نحدّث فقط الأعمدة المصدرية (task_points/ad_points/…)
- ونترك `total_points` يُحسب تلقائيًا من قاعدة البيانات

**ملفات سنعدّلها (مباشرة):**
- `src/hooks/useBoltTown.ts`
  - `getOrCreateTodayPoints`: insert بدون `total_points`
  - جميع `add*Points`: إزالة `updates.total_points = ...`
- `src/hooks/useBoltTasks.ts` و `src/hooks/useDailyTasks.ts`
  - helpers اللي بتضيف +5 لنقاط المسابقة: تحديث task_points فقط
- `src/components/ads/WatchAdCard.tsx`
  - helper adds ad_points فقط
- `src/hooks/useBoltMining.ts`
  - helper activity_points / streak_bonus فقط
- `src/hooks/useUserServers.ts`
  - بعد شراء السيرفر: تحديث task_points فقط (+100)
- `supabase/functions/telegram-webhook/index.ts`
  - `addBoltTownReferralPoints`: تحديث referral_points فقط (+10)
  - ومنع أي insert/update لـ total_points
- `supabase/functions/process-referral/index.ts`
  - نفس الإصلاح (حتى لو غير مستخدم، لتجنب أعطال مستقبلية)

**النتيجة المتوقعة:** أي حدث (مهمة/إعلان/إحالة/شراء سيرفر/تشيك‑إن) يبدأ يظهر نقاطه فورًا.

---

### 3) جعل الحساب “مضمون من الباك‑إند” (حتى لو فرونت‑إند فشل)
حاليًا الاعتماد كبير على أن الفرونت‑إند ينادي helpers بعد الحدث. لضمان عدم تكرار المشكلة:
- سنضيف Triggers في قاعدة البيانات لتحديث `bolt_town_daily_points` تلقائيًا عند حدوث الأحداث التالية:

**Triggers مقترحة:**
- عند `INSERT` في `bolt_completed_tasks` → زيادة `task_points` +5
- عند `INSERT` في `bolt_daily_task_completions` → زيادة `task_points` +5
- عند `INSERT` في `ad_views` → زيادة `ad_points` +2
- عند `INSERT` في `bolt_referrals` → زيادة `referral_points` +10 للـ referrer
- عند `INSERT` في `user_servers` → زيادة `task_points` +100
- عند تأكيد دفعة special task (مثلاً `ton_payments` status=confirmed + product_id='bolt-town-special-task') → تعيين `special_task_done=true` و `special_task_points=10` (مرة واحدة يوميًا)
- عند `INSERT` في `bolt_mining_sessions` أو حدث “start mining” (حسب الجدول الأنسب) → تعيين `activity_points=1` (مرة واحدة يوميًا)

**ملاحظة تقنية مهمة:** سنحسب اليوم دائمًا UTC:
`(timezone('utc', event_time))::date`
لكي لا يحدث اختلاف بين توقيت المستخدم وقاعدة البيانات.

**النتيجة المتوقعة:** حتى لو حدث Bug في UI، البيانات تظل تُسجل وتظهر في Bolt Town.

---

### 4) إصلاح مسابقة الإحالة (Contest) — الإحصائيات الواقعية + التحديث
#### 4.1 إصلاح رابط الإحالة في الفرونت‑إند
في `src/pages/Contest.tsx` سنغيّر توليد الرابط إلى صيغة يفهمها الباك‑إند:
- إما `start=${tgUser.username}` إن كان موجود
- أو `start=${tgUser.id}` كرقم مباشر
بدون prefix `ref_`.

#### 4.2 جعل الباك‑إند متسامح مع الروابط القديمة
في `supabase/functions/telegram-webhook/index.ts` سنضيف:
- إذا `referralCode` يبدأ بـ `ref_` → نحذف `ref_` قبل البحث
هذا مهم لأن كثير من المستخدمين قد يكون شارك الرابط القديم بالفعل.

#### 4.3 ضمان تحديث contest_participants بشكل صحيح “لكل كونتست”
حاليًا يتم وضع `referral_count = newTotalReferrals` (إجمالي العمر كله)، وهذا قد يعطي نتائج غير دقيقة عند بدء كونتست جديد.
سنعدل المنطق بحيث:
- contest_participants يزيد +1 لكل إحالة داخل الكونتست النشط
- وليس مساواة total_referrals.

**النتيجة المتوقعة:** صفحة Contest تعكس الواقع فورًا، وتزيد الأرقام عند أي إحالة جديدة.

---

### 5) جعل العدّاد “حقيقي من الباك‑إند”
الحل: إضافة Backend Function بسيطة (بدون أسرار) مثل:
- `server-time` ترجع:
  - `now_utc_ms`
  - `next_utc_midnight_ms` (لـ BoltTown reset)
  - ويمكن إضافة `contest_end_ms` عند الحاجة

ثم:
- تحديث عدادات:
  - `src/components/bolt-town/CountdownTimer.tsx`
  - `src/components/contest/CountdownTimer.tsx`
لتستخدم “وقت السيرفر” كأساس وتعمل resync كل 30–60 ثانية.

**النتيجة المتوقعة:** لو وقت جهاز المستخدم غلط، العدّاد يظل صحيح.

---

### 6) إظهار بيانات اليوم الحالي فورًا (Backfill اختياري لكن مهم)
لأن المستخدمين عملوا مهام/إعلانات/إحالات قبل الإصلاح، فمن المحتمل بيانات اليوم في `bolt_town_daily_points` صفر/غير موجودة.

سننفذ Backfill لليوم الحالي UTC:
- إما عبر SQL وظيفة (Database function) تقوم بتجميع:
  - عدد المهام اليوم → task_points
  - عدد الإعلانات اليوم → ad_points
  - عدد الإحالات اليوم → referral_points
  - شراء السيرفر اليوم → +100
  - special task المدفوع اليوم → +10
- ثم `upsert` في `bolt_town_daily_points` لكل user ظهر له نشاط اليوم.

ونفس الشيء لمسابقات الإحالة:
- بناء contest_participants من bolt_referrals خلال مدة الكونتست النشط.

(سأنفذها بطريقة آمنة ومحدودة لليوم/الكونتست الحالي فقط لتجنب الضغط على النظام).

---

## خطة الاختبار (Acceptance Tests)
1) **Publishing**: إعادة النشر والتأكد أنه يتم بدون خطأ.
2) **BoltTown**:
   - أكمل مهمة → تزيد نقاطك +5 فورًا وتظهر بالصفحة.
   - شاهد إعلان → تزيد +2 فورًا.
   - اعمل إحالة (مستخدم جديد عبر /start) → تزيد +10 فورًا.
   - اشترِ سيرفر → تزيد +100 فورًا.
   - ادفع special task → يزيد +10 وتصبح special_task_done=true.
   - تحقق أن `total_points` يظهر صحيح دائمًا لأنه محسوب من الباك‑إند.
3) **Contest**:
   - جرّب مشاركة الرابط الجديد → المستخدم الجديد عبر /start يُسجل referrer → contest_participants يتحدث.
   - تابع صفحة الكونتست وتأكد أن الأرقام تتغير فورًا.
4) **العدادات**:
   - غيّر وقت الجهاز (اختبار) وتأكد العدّاد ما زال صحيح لأنه مبني على وقت الباك‑إند.

---

## المخاطر وكيف نقللها
- تغيير نقاط مسابقة قائمة: سنقصر الـ Backfill على “اليوم الحالي” و “الكونتست النشط” فقط.
- تكرار احتساب النقاط: سنجعل triggers تعتمد على حدث الإدخال نفسه، ومع constraints/unique الموجودة + تحقق “مرة واحدة يوميًا” للـ activity/special task.

---

## ما الذي أحتاجه منك (معلومة واحدة فقط)
- هل تريد النقاط تُحتسب لكل نشاط “بدون حد” (مثلاً: كل إعلان +2 بلا حد) كما هو مكتوب في UI؟ سأطبق ذلك كما هو حاليًا إلا إذا أردت حدود يومية.