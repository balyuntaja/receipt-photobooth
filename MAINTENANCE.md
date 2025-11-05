# Maintenance Guide

## 📁 File Structure untuk Maintenance

### Constants & Configuration
- **`src/lib/constants.ts`** - Semua warna, theme, delays, dan config terpusat di sini
  - `COLORS` - Semua warna yang digunakan di aplikasi
  - `BUTTON_THEME` - Theme untuk button (background, border, dll)
  - `BORDER` - Border styles yang reusable
  - `ANIMATION` - Durasi animasi
  - `DELAYS` - Timeouts dan delays (dalam milliseconds)
  - `Z_INDEX` - Z-index layers untuk layering
  - `CONFIG` - Konfigurasi aplikasi (PIN, MAX_PHOTOS, dll)

- **`src/lib/templates.ts`** - Template dan print configuration
  - `PRINT_DIMENSIONS_CM` - Dimensi print dalam cm
  - `PRINT_CONFIG` - Konfigurasi DPI dan konversi
  - `PRINT_DIMENSIONS` - Export untuk digunakan di print function

### Component Structure
- **`src/components/ui/`** - Reusable UI components (Button, Card, Slider)
- **`src/components/`** - Page components (HomeScreen, TemplateSelection, dll)
- **`src/lib/`** - Utilities dan business logic

## 🎨 Theme Management

Semua warna sekarang terpusat di `src/lib/constants.ts`:
- Primary color: `COLORS.PRIMARY` (#99b3fc)
- Secondary color: `COLORS.SECONDARY` (#6b4b3e)
- Button theme: `BUTTON_THEME` (background, border, text)

Untuk mengubah warna aplikasi:
1. Edit `COLORS` di `src/lib/constants.ts`
2. Update CSS variable `--primary` di `src/index.css` jika perlu

## ⚙️ Configuration

Untuk mengubah konfigurasi aplikasi, edit `CONFIG` di `src/lib/constants.ts`:
- `DEFAULT_PIN` - PIN untuk keluar fullscreen
- `MAX_PHOTOS` - Jumlah maksimal foto yang bisa diambil
- `PIN_LENGTH` - Panjang PIN

## 🔧 Best Practices untuk Maintenance

1. **Selalu gunakan constants** dari `src/lib/constants.ts` daripada hardcode values
2. **Gunakan named exports** untuk memudahkan refactoring
3. **Hindari magic numbers** - gunakan constants
4. **Konsisten naming** - gunakan naming convention yang sama
5. **Komponen reusable** - extract logic yang sering dipakai

## 📝 Common Changes

### Mengubah Warna Button
Edit `BUTTON_THEME` di `src/lib/constants.ts`

### Mengubah Jumlah Maksimal Foto
Edit `CONFIG.MAX_PHOTOS` di `src/lib/constants.ts`

### Mengubah Delay/Timeout
Edit `DELAYS` di `src/lib/constants.ts`

### Mengubah Print Dimensions
Edit `PRINT_DIMENSIONS_CM` dan `PRINT_CONFIG` di `src/lib/templates.ts`

