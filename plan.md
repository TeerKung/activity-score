# แผนพัฒนา: กระดานคะแนน 4 คน

## เป้าหมายผลิตภัณฑ์

สร้างเว็บหน้าหลักเดียวสำหรับผู้เล่น 4 คนที่ทุกอุปกรณ์อ่านและแก้ไขข้อมูลชุดเดียวกันจากฐานข้อมูลกลาง ผู้ใช้แก้ไขชื่อและรูปภาพของผู้เล่นได้ แต่ไม่มีช่องข้อความหรือ control ใดที่ใช้กรอก/พิมพ์คะแนน คะแนนเพิ่มผ่านปุ่มเท่านั้น จำกัด 0–10 คะแนนต่อคน และเมื่อครบ 10 ปุ่มจะปิดการเพิ่ม

## แนวทางที่เลือก

- **Frontend:** React + TypeScript ใน starter `web-db-user` ที่มี Vite/Tailwind อยู่แล้ว
- **Backend:** Express + tRPC ผ่าน `/api/trpc` ของ starter
- **Persistence:** Managed MySQL-compatible database ผ่าน Drizzle ORM; เพิ่มตาราง `scoreboard_players` สำหรับข้อมูล player ทั้ง 4 คน
- **การซิงก์ข้อมูล:** ทุก query/mutation อ่านและเขียนฐานข้อมูลเดียวกัน; ฝั่ง client refetch หน้า scoreboard เป็นระยะสั้น ๆ หลัง mutation และทุก 8 วินาที เพื่อให้หลายอุปกรณ์เห็นความเปลี่ยนแปลงโดยไม่ต้องใช้ websocket
- **Authentication:** ไม่บังคับ login เพราะคำขอระบุให้ทุกคนดู/ใช้งานร่วมกัน; route เป็น public และ mutation เป็น public procedure ตาม scope ของเครื่องมือภายในทีม
- **รูปภาพ:** เก็บเป็น URL ใน database เพื่อใช้ได้ทันทีโดยไม่ต้องเปิด file storage เพิ่ม; ถ้า URL ใช้ไม่ได้จะแสดง fallback initials

## โครงสร้างหลัก

- `client/src/pages/Home.tsx` — หน้ากระดานหลัก, state การแก้ไขผู้เล่น, query/mutation, error/loading states
- `client/src/index.css` — design tokens, responsive layout, score rail, motion และ accessibility states
- `client/public/manus-routes.json` — route manifest ของ `/` และ `/404`
- `client/public/scoreboard-mark.svg` — โลโก้เฉพาะโปรเจกต์และ favicon
- `drizzle/schema.ts` — schema ตาราง `scoreboard_players`
- `drizzle/0001_scoreboard_players.sql` — additive migration สร้างตารางและ seed ผู้เล่นเริ่มต้น 4 คน
- `server/db.ts` — query สำหรับอ่านผู้เล่น, เพิ่มคะแนนแบบ atomic, แก้ชื่อ/รูป
- `server/routers.ts` — tRPC procedures `scoreboard.list`, `scoreboard.addPoint`, `scoreboard.updatePlayer`
- `README.md` — วิธีติดตั้ง, migration, รัน, การ deploy และโครงสร้างข้อมูลสำหรับ GitHub

## พฤติกรรมหน้าจอ

1. Header แสดงชื่อระบบ, คำอธิบายสั้น ๆ และสถานะ “ข้อมูลกลาง”
2. Summary card แสดงคะแนนรวม, จำนวนผู้เล่นที่ครบ 10 และคำอธิบายว่าทุกคนเห็นข้อมูลชุดเดียวกัน
3. Player card 4 ใบ แสดงหมายเลข, ชื่อ, รูป, คะแนนปัจจุบัน/10, progress rail 10 ช่อง และปุ่ม `ให้ 1 คะแนน`
4. กดปุ่มจะเรียก mutation เพิ่มทีละ 1 แบบ atomic; เมื่อ score = 10 ปุ่มถูก disabled และแสดง “ครบ 10 คะแนนแล้ว”
5. ปุ่มแก้ข้อมูลเปิด dialog ที่มีช่องชื่อและ URL รูปภาพเท่านั้น ไม่มี input คะแนน; บันทึกผ่าน mutation
6. สถานะ loading, saving, error และ empty/seed state ต้องมีข้อความที่อ่านง่าย
7. responsive ที่ 375px: การ์ดเรียง 1 คอลัมน์, ปุ่มกว้างพอสำหรับ touch, header ไม่ล้น; desktop: grid 2x2

## Deployment และ cache

เลือก **browser-rendered frontend (CSR/SPA) + API backend** เพราะหน้าเริ่มต้นเป็น shell เดียวและข้อมูลคะแนนต้องสดจากฐานข้อมูล ทุก request `/api/trpc/*` ไปที่ server; static build จาก Vite อยู่ใน `dist/public`; Dockerfile เดิมเสิร์ฟทั้ง Express API และ static assets ผ่าน origin เดียว

Production route intent (เตรียมใน Webdev config ก่อน publish หากต้อง publish):

- `/api/*` → `server`
- `/assets/*` → `static`, `cache: immutable`
- `/*` → `static`, `spaFallback: true`

HTML shell ไม่ควรแชร์ cache ข้าม deployment; assets ที่มี hash ใช้ immutable cache ตาม platform defaults; API คะแนนต้องไม่แชร์ cache เพราะ mutable และต้องสะท้อนการให้คะแนนล่าสุด

## Verification

- `pnpm check` ตรวจ TypeScript ทั้ง client/server
- `pnpm test` รันชุดทดสอบที่มีอยู่ เพื่อป้องกัน regression ของ starter
- `pnpm build` ตรวจ Vite + server bundle สำหรับ production
- เริ่ม `pnpm dev` บน port ที่ Webdev ตั้งไว้ แล้วตรวจ `GET /api/health` ได้ 200
- ตรวจ `GET /manus-routes.json` ได้ 200 และ JSON ตรงกับ source routes
- ตรวจ source ว่า score ไม่มี `<input type="number">` หรือ mutation ที่รับค่าคะแนนจากผู้ใช้โดยตรง; server clamp/atomic เพิ่มได้ทีละ 1 และปิดที่ 10

## ข้อจำกัดที่รับรู้

ผู้ใช้ยังไม่ได้ระบุชื่อจริงหรือรูปจริงของผู้เล่น จึง seed เป็น “ผู้เล่น 1–4” และใช้ initials/fallback สีต่างกัน ผู้ใช้สามารถแก้ผ่าน UI ได้ภายหลัง ข้อมูลรูปเก็บเป็น URL ไม่ใช่ binary upload เพื่อคงโปรเจกต์ไว้ใน feature server/database ที่เปิดใช้อยู่
