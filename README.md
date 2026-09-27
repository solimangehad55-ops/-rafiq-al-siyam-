# رفيق الصيام 🌙

تطبيق Android مجاني مبني بـ HTML + CSS + JavaScript + Vite + Capacitor.

## المميزات

- الاثنين والخميس.
- الأيام البيض 13 و14 و15 هجريًا.
- أذكار الصباح والمساء.
- ورد القرآن.
- عداد تسبيح.
- حفظ المهام محليًا.
- الوضع الليلي.
- إشعارات محلية مجدولة على الهاتف.
- تذكير بالنية في الليلة السابقة.
- تذكير بالسحور.
- لا يحتاج Firebase أو سيرفر لإشعارات الصيام.

## المتطلبات

- Node.js 22 أو أحدث.
- Android Studio حديث.
- Android SDK.
- Java/JDK الذي يطلبه إصدار Android Studio/Capacitor المثبت.

## 1) تثبيت الحزم

من داخل مجلد المشروع:

```bash
npm install
```

## 2) إنشاء مشروع Android

```bash
npx cap add android
```

بعدها:

```bash
npm run cap:sync
```

ثم:

```bash
npx cap open android
```

## 3) إذن الإشعارات

Android 13+ يحتاج موافقة المستخدم على POST_NOTIFICATIONS.
التطبيق يطلبها تلقائيًا عند تفعيل الإشعارات.

## 4) المنبهات الدقيقة

إذا أردت أفضل دقة ممكنة في وقت التذكير، افتح:

Android Studio
→ المشروع
→ android/app/src/main/AndroidManifest.xml

وأضف داخل عنصر `<manifest>`:

```xml
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
<uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM" />
```

ثم:

```bash
npx cap sync android
```

ملاحظة: Android 12+ يتعامل مع المنبهات الدقيقة كصلاحية خاصة، وقد يطلب من المستخدم السماح بـ "المنبهات والتذكيرات". التطبيق لا يفشل إذا لم يمنح المستخدم الصلاحية؛ يمكن أن يعمل بتوقيت غير دقيق قليلًا.

## 5) أيقونة الإشعار

ملف capacitor.config.ts يستخدم:

`ic_stat_rafiq`

لذلك يجب وضع أيقونة صغيرة باسم:

`ic_stat_rafiq.png`

داخل موارد Android المناسبة بعد إنشاء مشروع Android.

للاختبار الأول، إذا لم تضع أيقونة مخصصة، احذف من capacitor.config.ts:

```ts
smallIcon: 'ic_stat_rafiq'
```

واحذف `smallIcon: 'ic_stat_rafiq'` من app.js.

## 6) تشغيل على الهاتف

فعّل USB debugging في هاتف Android ثم:

```bash
npm run android:run
```

أو افتح Android Studio واضغط Run.

## 7) إنشاء APK مجاني

في Android Studio:

Build
→ Generate App Bundles or APKs
→ Generate APKs

لنسخة اختبار:

Build
→ Build APK(s)

ستجد الملف غالبًا داخل:

`android/app/build/outputs/apk/debug/`

يمكنك تثبيته على هاتفك مباشرة.

## 8) نسخة Release

من Android Studio:

Build
→ Generate Signed App Bundle / APK

أنشئ keystore خاصًا بك واحفظه في مكان آمن جدًا.

لا تفقد ملف الـ keystore أو كلمة المرور إذا كنت ستحدّث التطبيق مستقبلًا.

## ملاحظات مهمة

1. الإشعارات المحلية لا تحتاج إنترنت أو سيرفر.
2. التطبيق يجهز إشعارات للأيام القادمة (120 يومًا افتراضيًا).
3. عند فتح التطبيق، يعيد جدولة الفترة القادمة ويحدّثها.
4. إغلاق التطبيق بالطريقة العادية لا يمنع الإشعارات المجدولة.
5. استخدام Force Stop من إعدادات Android أو بعض أوضاع توفير البطارية الخاصة بالشركة المصنعة قد يؤثر على المنبهات.
6. وقت السحور في هذه النسخة يدخله المستخدم يدويًا. إذا أردت حساب السحور تلقائيًا قبل الفجر، نضيف لاحقًا نظام مواقيت الصلاة حسب الموقع.

## النشر على الإنترنت

يمكنك نشر نسخة الويب مجانًا على GitHub Pages أو أي استضافة static مجانية.

أما Google Play فهو اختياري، وليس مطلوبًا لإنشاء APK وتثبيته على هاتفك.
