
# خطة إصلاح مشكلة عدم ظهور المهام

## المشكلة المكتشفة

بعد الفحص، وجدت أن **السبب الرئيسي** لعدم ظهور المهام هو وجود فلتر في صفحة المهام يستبعد أي مهمة تحتوي على كلمات "mining" أو "mine" في العنوان!

**المهام المتأثرة (10 مهام نشطة لا تظهر):**
- Start Mining Ton Now (مهمتين)
- World Cup Mining
- Open Miner World Ton
- Open Miner World BTC
- Join Miner World Community
- Mine for 1 Hour
- Upgrade Mining Power
- Claim Mining Rewards
- Start Mining Session

## الحل المقترح

### 1. تعديل منطق الفلترة

إزالة الفلتر الذي يستبعد المهام التي تحتوي على كلمات mining/mine من العنوان، والاكتفاء بفلترة category فقط.

**قبل:**
```javascript
if (category === 'mining' || title.includes('mining') || title.includes('mine')) return false;
```

**بعد:**
```javascript
if (category === 'mining') return false;
```

هذا سيسمح بظهور المهام الخارجية (Partner Tasks) التي تحتوي على كلمة mining في عنوانها، مع الاحتفاظ بإخفاء المهام الداخلية من نوع mining category.

### 2. التغييرات المطلوبة

**ملف:** `src/pages/Tasks.tsx`

تعديل دالة `availableTasks` لإزالة الفلتر على العنوان:

```javascript
const availableTasks = useMemo(() => {
  const completed = new Set(completedTasks.map((c) => c.task_id));
  return allTasks.filter((t) => {
    if (completed.has(t.id)) return false;
    // Only exclude tasks with mining category (internal mining tasks)
    const category = (t.category || '').toLowerCase();
    if (category === 'mining') return false;
    // Exclude ads category
    if (category === 'ads') return false;
    return true;
  });
}, [allTasks, completedTasks]);
```

## النتيجة المتوقعة

بعد هذا التعديل:
- جميع مهام الشركاء (Partner Tasks) ستظهر بغض النظر عن العنوان
- مهام التعدين الداخلية فقط (category = mining) ستبقى مخفية
- لن تكون هناك حاجة لتغيير عناوين المهام الموجودة
