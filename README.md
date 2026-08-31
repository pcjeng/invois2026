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

> **Keselamatan:** Skema ini guna polisi RLS terbuka (sesuai untuk alat peribadi
> seorang pengguna). Untuk mod SaaS multi-pengguna, run `schema-saas.sql`
> selepas deploy — lihat bahagian 5 di bawah.

## 4. Login / Daftar akaun (Supabase Auth)

Aplikasi ada **skrin log masuk + daftar akaun** (mod SaaS):

- **Daftar** — pengguna baru klik "Daftar" pada skrin login. Jika Supabase
  meminta pengesahan email, pengguna perlu klik link dalam email tersebut
  sebelum boleh log masuk. (Untuk ujian pantas, boleh matikan pengesahan di
  Authentication → Providers → Email → "Confirm email".)
- **Lupa kata laluan** — hantar email reset. Supabase menghantar link reset;
  pastikan **Authentication → URL Configuration → Site URL** diisi dengan URL
  aplikasi (cth: https://pcjeng.github.io/invois2026/) supaya link membawa
  ke aplikasi. Selepas klik link, pengguna log masuk dan boleh tukar kata
  laluan di **Settings → Tukar Kata Laluan**.
- **Kunci data (WAJIB selepas deploy)** — run `supabase/schema-saas.sql`
  dalam SQL Editor. Ia menambah lajur `user_id` + polisi RLS per-pengguna:
  setiap akaun **hanya nampak data sendiri**. Ikut langkah 4 dalam fail SQL
  tersebut untuk memindahkan data lama kepada akaun admin (ganti
  `EMAIL_ANDA` dengan email admin, buang `--`, run sekali lagi).
- **Halang pendaftaran orang lain** (kalau tidak mahu orang ramai daftar):
  Authentication → Sign In / Providers → Email → matikan **Enable Sign Up**.

## 5. Cloudinary — upload logo/signature & simpan PDF ke cloud

1. Daftar percuma di [cloudinary.com](https://cloudinary.com).
2. Dashboard → **Settings → Upload → Upload presets → Add upload preset**
   → namakan (cth: `invois-unsigned`) → **Signing Mode: Unsigned** → Save.
3. Salin **Cloud name** (di dashboard) dan **nama preset** tersebut.
4. Masukkan kedua-dua nilai dalam `.env` (lokal) atau `.env.production`
   (untuk live):

   ```
   VITE_CLOUDINARY_CLOUD_NAME=cloud-name-anda
   VITE_CLOUDINARY_UPLOAD_PRESET=invois-unsigned
   ```

5. Restart dev server / push untuk deploy. Selepas itu:
   - **Settings** — boleh upload Logo & Signature terus dari fail imej
     (disimpan ke Cloudinary; pautan imej dijadikan logo/signature dokumen).
   - **Paparan cetak** — butang **“Simpan PDF ke Cloud”** menjana PDF A4
     daripada dokumen, upload ke Cloudinary, dan simpan pautan pada dokumen
     (butang “📎 PDF” akan muncul pada Dashboard).

> Nota: upload guna *unsigned preset* — nama cloud & preset akan tampak dalam
> kod frontend (standard untuk upload client-side). Had free tier Cloudinary:
> 25 kredit bulanan (≈25GB bandwidth/5GB storan) — cukup untuk permulaan.

## 6. Sistem Peranan — Admin vs User

- Semua akaun baru = **USER** biasa (data sendiri sahaja).
- Peranan disimpan dalam Supabase Auth (`app_metadata.role`) dan hanya boleh
  ditukar melalui SQL/dashboard — pengguna biasa tak boleh promote diri.
- **Jadikan diri anda admin**: run fail `supabase/schema-admin.sql` — ikut
  LANGKAH 1 dalam fail itu (ganti `EMAIL_ANDA`, run baris `update`), kemudian
  run keseluruhan fail untuk fungsi admin. Lepas log keluar & log masuk
  semula, menu **🛡️ Admin** akan muncul di navigation bar bawah.
- Panel Admin: senarai pengguna, bilangan dokumen, jadikan admin/user,
  ban/unban pengguna.

## Struktur projek

```
invois-app/
├── index.html
├── package.json
├── vite.config.js          # base './' (sesuai untuk GitHub Pages)
├── .env.example            # contoh env Supabase
├── .github/workflows/deploy.yml  # auto-deploy ke GitHub Pages
├── supabase/
│   ├── schema.sql          # skema asas + RLS
│   ├── schema-auth.sql     # kunci data untuk login (versi admin tunggal)
│   └── schema-saas.sql     # SaaS: user_id + polisi per-pengguna + pdf_url
│   └── schema-admin.sql    # peranan admin/user + fungsi RPC admin
└── src/
    ├── main.jsx            # entry + HashRouter
    ├── App.jsx             # routes
    ├── styles.css          # tema navy/emas + CSS cetak A4
    ├── lib/
    │   ├── db.js           # API data + auto pilih backend + auth facade
    │   ├── db.supabase.js  # backend Supabase (SaaS: user_id pada semua baris)
    │   ├── db.local.js     # backend localStorage (demo mode)
    │   ├── cloudinary.js   # upload imej & PDF ke Cloudinary
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
        ├── PrintView.jsx   # paparan cetak A4 / PDF + simpan PDF ke Cloud
        ├── Customers.jsx   # CRUD customer
        ├── Settings.jsx    # profil, Cloudinary upload, tukar kata laluan
        └── Admin.jsx       # panel admin (urus pengguna & peranan)
```
