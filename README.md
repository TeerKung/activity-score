# กระดานคะแนน 4 คน

เว็บกระดานคะแนนแบบข้อมูลกลางสำหรับผู้เล่น 4 คน ทุกอุปกรณ์อ่านและอัปเดตข้อมูลจากฐานข้อมูลเดียวกัน ผู้ใช้แก้ไขชื่อและลิงก์รูปภาพของผู้เล่นได้ ส่วนคะแนนไม่มีช่องกรอกตัวเลขและเพิ่มได้ด้วยการกดช่องคะแนนทีละ 1 เท่านั้น โดยจำกัดสูงสุดคนละ 10 คะแนน

## ความสามารถหลัก

- แสดงผู้เล่น 4 คน ชื่อ รูปภาพ และคะแนนปัจจุบันแบบเห็นได้ทันที
- เก็บข้อมูลผู้เล่นและคะแนนถาวรด้วย Managed MySQL-compatible database ผ่าน Drizzle
- ซิงก์หน้าจออัตโนมัติทุก 8 วินาที เพื่อให้หลายอุปกรณ์เห็นข้อมูลชุดเดียวกัน
- แก้ชื่อและ URL รูปภาพแยกจากการให้คะแนน
- เพิ่มคะแนนด้วยปุ่มเท่านั้น ป้องกันคะแนนเกิน 10 ด้วย atomic server update
- Responsive layout สำหรับมือถือ แท็บเล็ต และเดสก์ท็อป

## Stack

- React + TypeScript + Vite
- Express + tRPC
- Drizzle ORM + MySQL-compatible database
- Tailwind CSS v4 พร้อม custom CSS design system

## เริ่มต้นใช้งาน

```bash
pnpm install
pnpm db:migrate
pnpm dev
```

จากนั้นเปิด `http://localhost:3000` หากต้องการเลือก port อื่นให้ตั้งค่า `PORT` เช่น `PORT=3001 pnpm dev`

คำสั่งที่ใช้บ่อย:

```bash
pnpm check       # ตรวจ TypeScript
pnpm test        # รัน test suite
pnpm build       # สร้าง production bundle
pnpm start       # เสิร์ฟ production bundle
pnpm db:push     # สร้างและใช้ migration จาก schema ปัจจุบัน
```

ครั้งแรกที่เปิดหน้ากระดาน ระบบจะ seed ชื่อเริ่มต้น “ผู้เล่น 1–4” ให้โดยอัตโนมัติเมื่อฐานข้อมูลยังไม่มีแถวข้อมูล ผู้ใช้สามารถแก้ชื่อและรูปภาพได้จากปุ่ม “แก้ข้อมูล”

## โครงสร้างที่เกี่ยวข้อง

- `client/src/pages/Home.tsx` — หน้า scoreboard และ dialog แก้ข้อมูล
- `client/src/index.css` — design system และ responsive styles
- `server/routers.ts` — tRPC API ของ scoreboard
- `server/db.ts` — query, seed และ atomic score update
- `drizzle/schema.ts` — schema ตาราง `scoreboard_players`
- `drizzle/0001_chief_bloodscream.sql` — migration สร้างตาราง scoreboard
- `client/public/manus-routes.json` — route manifest
- `client/public/scoreboard-mark.svg` — โลโก้และ favicon

## API contract

- `scoreboard.list` — อ่านผู้เล่นเรียงตาม slot
- `scoreboard.addPoint({ id })` — เพิ่มคะแนนให้ผู้เล่นทีละ 1; server อนุญาตเฉพาะเมื่อคะแนนน้อยกว่า 10
- `scoreboard.updatePlayer({ id, name, imageUrl })` — แก้เฉพาะชื่อและ URL รูป ไม่รับค่า score

## นำขึ้น GitHub

สร้าง repository ว่างใน GitHub แล้วรันคำสั่งจากโฟลเดอร์โปรเจกต์:

```bash
git init
git add .
git commit -m "Build shared 4-player scoreboard"
git branch -M main
git remote add origin https://github.com/<your-account>/<your-repo>.git
git push -u origin main
```

อย่า commit ค่า secret เช่น `DATABASE_URL` หรือไฟล์ `.env` ตรวจ `.gitignore` ก่อน push ทุกครั้ง
