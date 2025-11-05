# 📋 Detailed Requirements - Receipt Photobooth

## 📖 Project Overview

**Receipt Photobooth** adalah aplikasi photobooth berbasis web yang dirancang untuk mencetak hasil foto secara instan menggunakan printer thermal 58mm. Aplikasi ini dibangun menggunakan **Vite + React + Shadcn UI**, dengan fokus pada tampilan yang ringan, cepat, dan mudah digunakan di acara offline seperti pameran, pesta, atau event kampus.

---

## 🎯 Project Goals

1. Menyediakan pengalaman photobooth yang cepat dan mudah digunakan
2. Mencetak hasil foto secara instan menggunakan printer thermal 58mm
3. Menyediakan soft file digital melalui QR Code
4. Mendukung penggunaan di acara offline (tidak memerlukan internet untuk core functionality)
5. Tampilan ringan dan responsif untuk berbagai perangkat

---

## 🛠 Tech Stack & Dependencies

### Core Technologies
- **Vite** – Build tool cepat untuk pengembangan React
- **React.js 19.1.1** – Framework utama frontend
- **Shadcn UI** – Komponen UI modern dan dapat dikustomisasi
- **Tailwind CSS 4.1.16** – Styling responsif dan fleksibel
- **TypeScript** (via .tsx files) – Type safety untuk komponen

### Required Dependencies
- **React Router** – Navigasi antar halaman (perlu diinstal)
- **JSPrintManager / WebUSB** (opsional) – Integrasi ke printer thermal
- **qrcode.react** atau **react-qr-code** – Generate QR Code (perlu diinstal)
- **html2canvas** atau **canvas API** – Untuk merge foto ke template (perlu diinstal)

### Existing Dependencies
- `@radix-ui/react-slot` – Untuk komponen Slot
- `class-variance-authority` – Untuk variant management
- `clsx` & `tailwind-merge` – Untuk utility className
- `lucide-react` – Icon library

---

## 🧭 Detailed Application Flow

### **Flow 1: Home Screen**

#### Functional Requirements
- **FR-1.1**: Tampilkan halaman utama dengan tombol besar **"Tap to Start"**
- **FR-1.2**: Tombol harus menonjol dan mudah diklik (desktop & touch)
- **FR-1.3**: Navigasi ke halaman template selection saat tombol diklik

#### UI/UX Requirements
- **UX-1.1**: Layout centered dengan tombol besar di tengah layar
- **UX-1.2**: Tombol menggunakan style Shadcn UI dengan size besar (lg atau xl)
- **UX-1.3**: Animasi hover/active state pada tombol
- **UX-1.4**: Optional: Logo atau branding di halaman utama

---

### **Flow 2: Pilih Template Photostrip**

#### Functional Requirements
- **FR-2.1**: Tampilkan beberapa template photostrip dalam bentuk Card
- **FR-2.2**: Template disajikan dalam layout grid (1 baris atau responsive grid)
- **FR-2.3**: Setiap card berisi preview gambar template
- **FR-2.4**: User dapat memilih template menggunakan radio button atau card selection
- **FR-2.5**: Template berukuran sesuai printer thermal 58mm (width: ~58mm)
- **FR-2.6**: Validasi: User harus memilih minimal 1 template sebelum melanjutkan
- **FR-2.7**: Tombol "Next" atau "Continue" untuk melanjutkan ke sesi foto

#### UI/UX Requirements
- **UX-2.1**: Card template dengan preview visual yang jelas
- **UX-2.2**: Visual feedback saat template dipilih (border highlight, checkmark)
- **UX-2.3**: Tombol "Back" untuk kembali ke Home Screen
- **UX-2.4**: Responsive design untuk berbagai ukuran layar

#### Data Requirements
- **DR-2.1**: Template data harus disimpan (array of template objects)
- **DR-2.2**: Setiap template memiliki:
  - `id`: unique identifier
  - `name`: nama template
  - `previewImage`: path ke preview image
  - `templateImage`: path ke template file (untuk merge)
  - `dimensions`: { width: number, height: number }

---

### **Flow 3: Take Photo Session**

#### Functional Requirements
- **FR-3.1**: Aktivasi kamera menggunakan Webcam (MediaDevices API)
- **FR-3.2**: Request permission untuk mengakses kamera
- **FR-3.3**: Error handling jika kamera tidak tersedia atau permission ditolak
- **FR-3.4**: Tampilkan preview kamera real-time
- **FR-3.5**: Implementasi countdown timer (3…2…1) sebelum pengambilan foto
- **FR-3.6**: User mengambil **3 foto berturut-turut** (setelah setiap countdown)
- **FR-3.7**: Simpan 3 foto dalam state/memory
- **FR-3.8**: Setelah selesai, tampilkan opsi:
  - **Retake All** – mengulangi sesi foto dari awal
  - **Next** – melanjutkan ke pemilihan hasil

#### UI/UX Requirements
- **UX-3.1**: Preview kamera fullscreen atau large preview
- **UX-3.2**: Countdown timer dengan animasi besar dan jelas (3…2…1)
- **UX-3.3**: Visual feedback saat foto diambil (flash effect atau shutter sound)
- **UX-3.4**: Progress indicator menunjukkan foto ke berapa (1/3, 2/3, 3/3)
- **UX-3.5**: Preview thumbnails dari 3 foto yang sudah diambil
- **UX-3.6**: Tombol "Retake All" dengan warna warning/secondary
- **UX-3.7**: Tombol "Next" dengan warna primary
- **UX-3.8**: Optional: Tombol untuk retake foto individual (bukan semua)

#### Technical Requirements
- **TR-3.1**: Gunakan `navigator.mediaDevices.getUserMedia()` untuk akses kamera
- **TR-3.2**: Capture foto menggunakan Canvas API atau `captureStream()`
- **TR-3.3**: Simpan foto sebagai base64 atau Blob untuk diproses lebih lanjut
- **TR-3.4**: Handle browser compatibility (Chrome, Firefox, Safari, Edge)

---

### **Flow 4: Pilih Foto untuk Dicetak**

#### Functional Requirements
- **FR-4.1**: Tampilkan 3 hasil foto dalam bentuk grid atau carousel
- **FR-4.2**: User dapat memilih **1 foto terbaik** untuk digunakan di template
- **FR-4.3**: Visual indicator untuk foto yang dipilih
- **FR-4.4**: Setelah memilih foto, aplikasi melakukan merge foto ke template photostrip
- **FR-4.5**: Tampilkan preview hasil akhir:
  - Template photostrip berisi foto pilihan yang sudah di-merge
  - Di sisi kanan tampil **QR Code** untuk mengunduh soft file foto
- **FR-4.6**: Tombol untuk kembali ke pemilihan foto (jika ingin mengubah pilihan)

#### UI/UX Requirements
- **UX-4.1**: Grid layout dengan 3 foto yang jelas terlihat
- **UX-4.2**: Hover effect dan border highlight saat foto dipilih
- **UX-4.3**: Preview hasil merge tampil jelas di kiri
- **UX-4.4**: QR Code dengan size yang cukup besar untuk mudah di-scan
- **UX-4.5**: Loading indicator saat proses merge sedang berlangsung
- **UX-4.6**: Tombol "Back" untuk kembali memilih foto

#### Technical Requirements
- **TR-4.1**: Merge foto ke template menggunakan Canvas API atau html2canvas
- **TR-4.2**: Generate QR Code yang berisi link/download URL
- **TR-4.3**: QR Code harus bisa di-scan dengan aplikasi QR scanner standar
- **TR-4.4**: Simpan hasil merge sebagai image file untuk dicetak

---

### **Flow 5: Preview & Print**

#### Functional Requirements
- **FR-5.1**: Menampilkan hasil akhir:
  - **Kiri:** preview foto dalam template photostrip
  - **Kanan:** **QR Code** menuju file digital (Google Drive / link lokal)
- **FR-5.2**: Tombol **"Print"** untuk mencetak ke printer receipt 58mm
- **FR-5.3**: Integrasi dengan printer thermal menggunakan JSPrintManager atau WebUSB
- **FR-5.4**: Validasi printer tersedia sebelum print
- **FR-5.5**: Error handling jika print gagal
- **FR-5.6**: Success message setelah print berhasil
- **FR-5.7**: Tombol **"New Session"** untuk kembali ke halaman utama
- **FR-5.8**: Optional: Tombol download untuk menyimpan soft file

#### UI/UX Requirements
- **UX-5.1**: Split layout dengan preview di kiri dan QR Code di kanan
- **UX-5.2**: Preview hasil harus sesuai dengan ukuran cetak (58mm width)
- **UX-5.3**: QR Code harus jelas dan mudah di-scan
- **UX-5.4**: Tombol "Print" dengan icon printer, prominent
- **UX-5.5**: Loading state saat print sedang diproses
- **UX-5.6**: Success/error toast notification
- **UX-5.7**: Tombol "New Session" dengan variant secondary atau outline

#### Technical Requirements
- **TR-5.1**: Konversi hasil merge ke format yang didukung printer (image/PDF)
- **TR-5.2**: Set printer settings untuk thermal 58mm:
  - Width: 58mm (atau ~218 pixels pada 96 DPI)
  - Auto-cut (jika printer support)
  - Print density/quality
- **TR-5.3**: Handle printer communication via JSPrintManager atau WebUSB API
- **TR-5.4**: QR Code harus berisi URL yang valid dan accessible

#### Data/Storage Requirements
- **DR-5.1**: Simpan hasil foto (soft file) ke storage lokal atau cloud
- **DR-5.2**: Generate unique URL atau ID untuk setiap sesi foto
- **DR-5.3**: QR Code harus link ke file yang bisa di-download

---

## 🗂 Recommended Folder Structure

```
src/
├── components/
│   ├── ui/                    # Shadcn UI components
│   │   ├── button.tsx
│   │   ├── card.tsx           # Untuk template selection
│   │   ├── radio-group.tsx    # Untuk template selection
│   │   └── ...                # Komponen UI lainnya
│   │
│   ├── HomeScreen.jsx         # Halaman utama
│   ├── TemplateSelection.jsx  # Pilih template
│   ├── CameraSession.jsx      # Take photo session
│   ├── PhotoSelection.jsx     # Pilih foto untuk dicetak
│   ├── PreviewPrint.jsx       # Preview & Print
│   │
│   ├── CameraPreview.jsx      # Komponen preview kamera
│   ├── CountdownTimer.jsx     # Komponen countdown
│   ├── PhotoGrid.jsx          # Grid untuk menampilkan foto
│   ├── QRCodeDisplay.jsx      # Komponen QR Code
│   └── PrintManager.jsx       # Logic untuk print
│
├── lib/
│   ├── utils.ts               # Utility functions
│   ├── camera.ts              # Camera utilities
│   ├── image-processing.ts    # Merge foto ke template
│   └── printer.ts              # Printer integration
│
├── assets/
│   ├── templates/             # Template photostrip images
│   │   ├── template-1.png
│   │   ├── template-2.png
│   │   └── ...
│   └── ...
│
├── App.jsx                    # Main app dengan routing
├── main.jsx
└── index.css
```

---

## ✅ Acceptance Criteria

### Home Screen
- [ ] Tombol "Tap to Start" besar dan jelas terlihat
- [ ] Navigasi ke template selection berfungsi
- [ ] Responsive di berbagai ukuran layar

### Template Selection
- [ ] Minimal 3 template tersedia
- [ ] Preview template jelas terlihat
- [ ] Selection state bekerja dengan baik
- [ ] Validasi sebelum melanjutkan

### Camera Session
- [ ] Kamera aktif dan preview muncul
- [ ] Countdown timer bekerja (3…2…1)
- [ ] 3 foto berhasil diambil berturut-turut
- [ ] Progress indicator menunjukkan foto ke berapa
- [ ] Retake All berfungsi
- [ ] Error handling jika kamera tidak tersedia

### Photo Selection
- [ ] 3 foto ditampilkan dengan jelas
- [ ] User bisa memilih 1 foto
- [ ] Merge foto ke template berhasil
- [ ] QR Code muncul dan bisa di-scan
- [ ] Preview hasil merge sesuai

### Preview & Print
- [ ] Preview hasil akhir jelas
- [ ] QR Code bisa di-scan dan link valid
- [ ] Print berfungsi ke printer thermal 58mm
- [ ] Success/error handling
- [ ] New Session kembali ke home

---

## 🚨 Edge Cases & Error Handling

1. **Kamera tidak tersedia**
   - Tampilkan error message yang jelas
   - Berikan opsi untuk upload foto manual (optional)

2. **Permission kamera ditolak**
   - Tampilkan instruksi untuk enable permission
   - Button untuk request permission lagi

3. **Printer tidak tersedia**
   - Tampilkan warning bahwa print tidak bisa dilakukan
   - Tetap tampilkan QR Code untuk download soft file
   - Optional: Simpan untuk print nanti

4. **Browser tidak support WebUSB**
   - Fallback ke JSPrintManager atau metode lain
   - Tampilkan info browser yang direkomendasikan

5. **Foto gagal di-merge**
   - Error message yang jelas
   - Opsi untuk retry atau kembali ke photo selection

6. **Storage penuh (untuk soft file)**
   - Warning message
   - Opsi untuk cleanup atau download langsung

---

## 📱 Responsive Design Requirements

- **Desktop**: Full layout dengan split view
- **Tablet**: Layout yang bisa di-scroll
- **Mobile**: Stack layout (vertical)
- **Touch-friendly**: Semua tombol minimal 44x44px untuk touch

---

## 🎨 UI/UX Guidelines

- Gunakan Shadcn UI components untuk konsistensi
- Warna mengikuti theme yang sudah ada
- Animasi smooth dan tidak mengganggu
- Feedback visual untuk setiap interaksi
- Loading states untuk operasi async
- Error messages yang user-friendly

---

## 🔐 Security & Privacy

- Tidak menyimpan foto permanen di server (jika ada)
- Foto hanya tersimpan di browser (session)
- QR Code link memiliki expiration time (optional)
- Request kamera permission dengan jelas

---

## 📝 Notes

- Aplikasi ini fokus untuk penggunaan offline (event/photobooth)
- Printer thermal 58mm adalah target utama
- QR Code untuk soft file adalah fitur tambahan yang penting
- Perlu testing di berbagai browser dan device

