<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Vibe Helper

تطبيق React + Vite لإدارة مشاريع برمجية مع دردشة ذكاء اصطناعي، تنظيم الملفات، Knowledge Base، و Smart Clipboard.

## تحليل سريع للمشروع

- **الواجهة الأمامية:** React + TypeScript.
- **الخدمات:** تكامل Gemini API + Firebase Auth.
- **التخزين المحلي:** IndexedDB (fallback).
- **الخلفية:** Express + Prisma API لحفظ المشاريع، الملفات، المحادثات، و Knowledge Base.

## المميزات المضافة/المكتملة

- إنشاء وربط قاعدة بيانات Prisma (SQLite) محليًا عند عدم وجود قاعدة بيانات.
- إصلاح حفظ شجرة الملفات في الـ backend (كان يوجد خلل يمنع حفظ الأبناء).
- إضافة تنظيف تلقائي للملفات المحذوفة من المشروع عند الحفظ.
- تفعيل إنشاء المشروع فعليًا عبر API بدل الاعتماد على بيانات مؤقتة فقط.
- إضافة endpoint فحص صحة (`/api/health`).

## التشغيل المحلي

**المتطلبات:** Node.js 18+

1. تثبيت الحزم:
   ```bash
   npm install
   ```

2. إنشاء قاعدة البيانات + توليد Prisma client:
   ```bash
   npm run db:generate
   npm run db:push
   ```

3. تشغيل الـ backend:
   ```bash
   npm run backend
   ```

4. تشغيل الواجهة الأمامية (في Terminal آخر):
   ```bash
   npm run dev
   ```

5. (اختياري) إعداد Gemini API:
   - أضف `GEMINI_API_KEY` في ملف `.env.local`.

## ملاحظات قواعد البيانات

- افتراضيًا سيتم إنشاء قاعدة محلية في:
  - `prisma/dev.db`
- يمكنك استخدام أي DB أخرى عبر متغير البيئة:
  - `DATABASE_URL`
