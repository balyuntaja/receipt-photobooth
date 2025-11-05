# 📸 Receipt Photobooth

Receipt Photobooth adalah aplikasi photobooth berbasis web yang dirancang untuk mencetak hasil foto secara instan menggunakan **printer thermal 58mm**. Aplikasi ini dibangun menggunakan **Vite + React + Shadcn UI**, dengan fokus pada tampilan yang ringan, cepat, dan mudah digunakan di acara offline seperti pameran, pesta, atau event kampus.

---

## 🚀 Tech Stack

- **Vite** – Build tool cepat untuk pengembangan React
- **React.js** – Framework utama frontend
- **Shadcn UI** – Komponen UI modern dan dapat dikustomisasi
- **Tailwind CSS** – Styling responsif dan fleksibel
- **React Router** – Navigasi antar halaman
- **JSPrintManager / WebUSB (opsional)** – Integrasi ke printer thermal

---

## 🧭 Flow Aplikasi

### 1. **Home Screen**
- Tampilan utama dengan tombol besar **“Tap to Start”**.
- Saat ditekan, pengguna diarahkan ke halaman pemilihan template photostrip.

---

### 2. **Pilih Template Photostrip**
- User disajikan beberapa **template photostrip** dalam bentuk **Card** (dalam satu baris/grid).
- Setiap card berisi **preview gambar template** dan dapat dipilih menggunakan **radio button**.
- Template berukuran menyesuaikan **printer thermal 58mm**.
- Setelah memilih template, user lanjut ke sesi foto.

---

### 3. **Take Photo Session**
- Kamera aktif menggunakan **Webcam (MediaDevices API)**.
- Terdapat **countdown timer (3…2…1)** sebelum pengambilan foto.
- User akan mengambil **3 foto berturut-turut**.
- Setelah selesai, muncul opsi:
  - **Retake All** – mengulangi sesi foto dari awal.
  - **Next** – melanjutkan ke pemilihan hasil.

---

### 4. **Pilih Foto untuk Dicetak**
- Dari 3 hasil foto, user dapat memilih **1 foto terbaik** yang akan digunakan di template photostrip.
- Setelah memilih, aplikasi akan menampilkan **preview hasil akhir**:
  - Template photostrip berisi foto pilihan yang sudah di-merge.
  - Di sisi kanan tampil **QR Code** untuk mengunduh soft file foto.

---

### 5. **Preview & Print**
- Menampilkan hasil akhir:
  - **Kiri:** preview foto dalam template photostrip.
  - **Kanan:** **QR Code** menuju file digital (Google Drive / link lokal).
- Tombol **“Print”** untuk mencetak ke printer receipt 58mm.
- Tombol **“New Session”** untuk kembali ke halaman utama.

---

## 🧩 Struktur Folder (Direkomendasikan)

