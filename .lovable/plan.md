
# نظام تحقق صارم لمنع المدفوعات الوهمية

## المشاكل الأمنية الحالية

### 1. شراء السيرفر بدون تحقق حقيقي
- دالة `purchaseServer` في `useUserServers.ts` تُضيف السيرفر مباشرة لقاعدة البيانات فور نقر "Payment Success" - حتى لو كانت المعاملة مزيفة أو لم تُؤكد بعد على البلوكتشين.

### 2. شراء التذاكر بدون ربط بالدفع
- السبين يُسجَّل في `spin_history` بدون ربط بـ `ton_payments` معتمد.

### 3. التحقق من البلوكتشين غير كافٍ
- `verify-ton-payment` يتحقق من الوقت والمبلغ فقط لكن لا يتحقق من عنوان المُرسِل أو أن المعاملة وصلت فعلًا لمحفظتنا.

### 4. الـ BOC ليس TX Hash حقيقي
- الـ BOC هو ما يُرسل للبلوكتشين لكنه ليس هاش المعاملة المؤكدة - لا يمكن استخدامه للتحقق.

---

## الحل: نظام تحقق متعدد الطبقات

### الطبقة 1: قاعدة البيانات (Server-side Enforcement)

**إضافة جدول `payment_verifications_log`** لتتبع كل دفعة مع حالتها:
```sql
-- جدول سجل التحقق
CREATE TABLE payment_verifications_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id uuid REFERENCES ton_payments(id),
  user_id uuid REFERENCES bolt_users(id),
  product_type text,
  amount_ton numeric,
  tx_hash text UNIQUE,
  blockchain_verified boolean DEFAULT false,
  verified_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- منع الإضافة المزدوجة عبر tx_hash
CREATE UNIQUE INDEX ON payment_verifications_log(tx_hash) WHERE tx_hash IS NOT NULL;
```

**تعديل جدول `user_servers`** لإضافة `payment_id` إلزامي:
```sql
ALTER TABLE user_servers ADD COLUMN payment_id uuid REFERENCES ton_payments(id);
ALTER TABLE user_servers ADD COLUMN payment_verified boolean DEFAULT false;
```

**تعديل جدول `spin_history`** لإضافة `payment_id` إلزامي:
```sql
ALTER TABLE spin_history ADD COLUMN payment_id uuid REFERENCES ton_payments(id);
```

### الطبقة 2: Edge Function - التحقق الحقيقي من البلوكتشين

**تحديث `verify-ton-payment`** ليتحقق بشكل صارم:

1. **استخراج TX Hash الحقيقي من BOC** باستخدام TON API
2. **التحقق من أن المعاملة وصلت لعنواننا المحدد** فقط
3. **التحقق من المبلغ بدقة** مع هامش 0.01 TON
4. **التحقق من عنوان المُرسِل** يطابق محفظة المستخدم
5. **تسجيل كل TX Hash مرة واحدة فقط** في `payment_verifications_log`

```typescript
// التحقق الحقيقي عبر TON Center API
const verifyOnBlockchain = async (boc: string, expectedAmount: number, senderAddress: string) => {
  // 1. إرسال BOC للحصول على TX Hash الحقيقي
  const txHash = await getTxHashFromBoc(boc);
  
  // 2. التحقق من المعاملة بالـ hash الحقيقي
  const tx = await fetchTransaction(txHash);
  
  // 3. التحقق من:
  // - العنوان المستقبِل هو عنواننا فقط
  // - المبلغ صحيح
  // - المُرسِل هو محفظة المستخدم
  // - المعاملة مؤكدة وليست pending
  
  return { verified: true, txHash, actualAmount };
};
```

### الطبقة 3: Frontend - ربط الدفع بالمنتج

**تعديل `useUserServers.ts` - `purchaseServer`:**
- تغيير المنطق: السيرفر **لا يُضاف** حتى يتأكد `verify-ton-payment` من المعاملة
- تمرير `paymentId` من `ton_payments` للتحقق المسبق

**تعديل `Spin.tsx` - شراء التذاكر:**
- ربط `payment_id` المعتمد بكل شراء للتذاكر

**تعديل `WithdrawalRequirementsModal.tsx`:**
- التحقق من أن السيرفر والتذاكر مرتبطة بمدفوعات `status = 'confirmed'`

### الطبقة 4: إشعارات فورية للمشبوه

**تحديث `notify-suspicious-payment`** لإرسال تنبيه فوري عند:
- محاولة إضافة سيرفر بدون payment_id مؤكد
- إعادة استخدام نفس TX Hash
- تباين بين المبلغ المتوقع والفعلي

---

## خطة التنفيذ

### الخطوة 1: تعديل قاعدة البيانات (Migration)
- إضافة `payment_id` لجدولي `user_servers` و `spin_history`
- إنشاء جدول `payment_verifications_log`
- إضافة قيود UNIQUE على `tx_hash`

### الخطوة 2: تحديث `verify-ton-payment` Edge Function
- التحقق الحقيقي من BOC عبر TON API
- استخراج TX Hash الحقيقي
- التحقق من المُرسِل والمبلغ والعنوان
- تسجيل في `payment_verifications_log`

### الخطوة 3: تعديل منطق شراء السيرفر
- `purchaseServer` تستقبل `paymentId` وتتحقق من حالته أولاً
- السيرفر لا يُضاف حتى يكون `payment.status = 'confirmed'`

### الخطوة 4: تعديل منطق شراء التذاكر
- ربط `spin_history` بـ `payment_id` مؤكد

### الخطوة 5: تحديث `WithdrawalRequirementsModal`
- التحقق من `payment_verified = true` في السيرفرات
- التحقق من `payment_id IS NOT NULL` في التذاكر

---

## النتيجة المتوقعة

| الوضع الحالي | بعد التحسين |
|---|---|
| السيرفر يُضاف فور الضغط على زر الدفع | السيرفر لا يُضاف إلا بعد تأكيد البلوكتشين |
| التذاكر تُسجَّل بدون ربط بالدفع | التذاكر مرتبطة بـ payment_id مؤكد |
| BOC يُستخدم كـ tx_hash (غير كافٍ) | TX Hash الحقيقي من البلوكتشين |
| لا حماية من إعادة استخدام المعاملة | UNIQUE constraint على tx_hash |
| لا تحقق من عنوان المُرسِل | التحقق من أن المُرسِل هو المستخدم |
