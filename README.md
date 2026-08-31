# Invois App — Quotation / Invoice / Receipt (React + Supabase)

Sistem ringkas untuk buat **quotation (sebut harga), invois dan resit** — reka bentuk
mengikut aplikasi mobile rujukan (header navy, butang simpan emas, matawang **RM**).

Ciri-ciri:
- **12 jenis dokumen**: Invoice, Tax Invoice, Proforma Invoice, Receipt, Sales Receipt,
  Cash Receipt, Quote, Estimate, Credit Memo, Credit Note, Purchase Order, Delivery Note
- Nombor dokumen **automatik** (mula 100, setiap jenis berasingan — cth: `QUO-100`)
- Data syarikat (From) & customer (Bill To) — customer boleh disimpan & dipilih semula
- Item baris + **Subtotal / Discount / Tax % / TOTAL** (auto kira)
- **Saved Items** — katalog produk untuk tambah item pantas
- **Print / Save PDF** — susun atur A4 kemas (ada ruang logo, signature & notes)
- Archive, duplicate, status (Draft / Sent / Paid / Accepted…)
- **Demo mode**: kalau Supabase belum disambung, data disimpan dalam pelayar
  (localStorage) — aplikasi tetap boleh dicuba serta-merta

---

## 1. Run secara lokal

```bash
npm install
npm run dev
```

Buka pautan yang dipaparkan (biasanya `http://localhost:5173`).

> **Penting:** Jangan buka fail `index.html` terus dengan double-click —
> page akan kosong. Aplikasi React mesti di-run dengan `npm run dev`
> (masa development) atau `npm run build` diikuti `npm run preview`
> (versi production).

## 2. Sambungkan Supabase (database)

1. Daftar / log masuk [supabase.com](https://supabase.com) → **New project**.
2. Buka **SQL Editor** → **New query** → tampal keseluruhan fail
   `supabase/schema.sql` → klik **Run**.
3. Pergi ke **Project Settings → API**. Salin dua nilai ini:
   - **Project URL**
   - **anon public** key (Project API keys)
4. Dalam folder projek, salin `.env.example` kepada `.env` dan isi:

   ```
   VITE_SUPABASE_URL=https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOi... (anon key anda)
   ```

5. Restart `npm run dev`. Banner "Demo mode" akan hilang — semua data kini
   disimpan ke dalam Supabase.

> **Keselamatan:** Skema ini guna polisi RLS terbuka (sesuai untuk alat peribadi
> seorang pengguna). Sesesiapa yang ada URL + anon key boleh baca/tulis data.
> Untuk lebih selamat, tambah Supabase Auth kemudian (lihat komen dalam
> `schema.sql`).

## 3. Push ke GitHub + aktifkan GitHub Pages

```bash
git init
git add .
git commit -m "Invois app"
git branch -M main
git remote add origin https://github.com/USERNAME/invois-app.git
git push -u origin main
```

Kemudian di GitHub:

1. Repo → **Settings → Pages** → bahagian *Build and deployment* →
   Source: pilih **GitHub Actions**.
2. Workflow `.github/workflows/deploy.yml` yang disertakan akan bina & deploy
   secara automatik setiap kali push ke `main`.
3. Laman akan hidup di `https://USERNAME.github.io/invois-app/`.

> **Nota:** Jangan push fail `.env` — ia sudah berada dalam `.gitignore`.
> GitHub Pages tak perlukan `.env`; aplikasi akan berjalan dalam demo mode
> sehingga anda letak secrets secara lain (cth. GitHub Actions secrets +
> build kustom). Untuk penggunaan harian, `npm run dev` di komputer sendiri
> dengan `.env` adalah cara paling mudah.

## 4. Login Admin (Supabase Auth) — lindungi data awak

Aplikasi dah ada **skrin log masuk**. Untuk kunci data supaya hanya admin boleh
nampak, ikut langkah ni mengikut urusan:

1. **Tunggu deployment siap** (GitHub Actions lulus / Vercel siap rebuild).
2. Supabase → **SQL Editor** → run keseluruhan fail `supabase/schema-auth.sql`
   — ini membuang akses awam dan hadkan data kepada admin yang login sahaja.
3. Buat akaun admin: Supabase → **Authentication → Users → Add user →
   Create new user** → masukkan email + kata laluan awak → tick
   **Auto Confirm User** → Save.
4. (Digalakkan) Supabase → **Authentication → Sign In / Providers → Email** →
   matikan **Enable Sign Up** supaya orang lain tak boleh daftar sendiri.
5. Buka aplikasi → log masuk dengan email + kata laluan admin tadi.

> Selepas langkah 2, sesiapa tanpa akaun admin takkan nampak apa-apa data —
> walaupun ada URL & anon key. Jangan kongsi kata laluan admin.

## Struktur projek

```
invois-app/
├── index.html
├── package.json
├── vite.config.js          # base './' (sesuai untuk GitHub Pages)
├── .env.example            # contoh env Supabase
├── .github/workflows/deploy.yml  # auto-deploy ke GitHub Pages
├── supabase/
│   ├── schema.sql          # skema database + RLS (run dalam Supabase SQL Editor)
│   └── schema-auth.sql     # naik taraf keselamatan: kunci data untuk admin login
└── src/
    ├── main.jsx            # entry + HashRouter
    ├── App.jsx             # routes
    ├── styles.css          # tema navy/emas + CSS cetak A4
    ├── lib/
    │   ├── db.js           # API data + auto pilih backend
    │   ├── db.supabase.js  # backend Supabase
    │   ├── db.local.js     # backend localStorage (demo mode)
    │   ├── calc.js         # pengiraan subtotal/discount/tax/total
    │   ├── docTypes.js     # 12 jenis dokumen, prefix, status
    │   └── format.js       # format RM & tarikh
    ├── components/
    │   ├── Layout.jsx      # header navy + bottom nav + butang Log Keluar
    │   ├── AuthGate.jsx    # gerbang login admin (Supabase Auth)
    │   ├── DocTypePicker.jsx
    │   └── ItemsEditor.jsx
    └── pages/
        ├── Dashboard.jsx   # senarai dokumen + tapisan + carian
        ├── Editor.jsx      # borang dokumen (ikut rujukan)
        ├── PrintView.jsx   # paparan cetak A4 / PDF
        ├── Customers.jsx   # CRUD customer
        └── Settings.jsx    # profil syarikat + saved items
```
