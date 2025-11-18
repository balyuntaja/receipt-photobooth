# API Integration Documentation

## Overview

Aplikasi ini terintegrasi dengan backend API untuk upload dan view foto. API endpoints menggunakan Firebase Storage untuk menyimpan file.

## Konfigurasi API

Nilai konfigurasi API disimpan di file `config.json` pada root project:

```json
{
  "apiBaseUrl": "http://localhost:3000",
  "apiKey": "ac89cefb7d385811283fa978c241b8c4ec3a0def07d8807318e1fcaab1fbef33"
}
```

**Note**: Jika file ini tidak disesuaikan, aplikasi akan menggunakan nilai default di atas.

## API Endpoints

### POST `/upload`

Upload multiple files ke Firebase Storage dengan sessionId.

**Request:**
- Method: `POST`
- Content-Type: `multipart/form-data`
- Authentication: API Key via `X-API-Key` header
- Query Parameter: `sessionId` (required)
- Body: Multiple files dengan field names `photo-1`, `photo-2`, `photo-3`, atau `gif`

**Response:**
```json
{
  "success": true,
  "sessionId": "abc123",
  "bucketUrl": "https://storage.googleapis.com/bucket-name",
  "count": 4,
  "files": [
    {
      "filename": "image1.jpg",
      "uploadedName": "abc123-1.jpg",
      "url": "https://storage.googleapis.com/bucket-name/abc123-1.jpg",
      "photoIndex": "1"
    }
  ]
}
```

### GET `/view`

Get all files untuk sessionId tertentu.

**Request:**
- Method: `GET`
- Query Parameter: `sessionId` (required)

**Response:**
```json
{
  "success": true,
  "sessionId": "abc123",
  "bucketUrl": "https://storage.googleapis.com/bucket-name",
  "count": 4,
  "files": [
    {
      "name": "abc123-1.png",
      "url": "https://storage.googleapis.com/bucket-name/abc123-1.png",
      "photoIndex": "1",
      "contentType": "image/png",
      "size": "123456",
      "timeCreated": "2024-12-25T14:30:00.000Z",
      "updated": "2024-12-25T14:30:00.000Z"
    }
  ]
}
```

## Frontend Implementation

### Files Created

1. **`src/lib/api.ts`** - API utility functions
   - `generateSessionId()` - Generate unique session ID
   - `uploadFiles(files, sessionId)` - Upload files to backend
   - `viewFiles(sessionId)` - Fetch files for session
   - `dataURLtoFile(dataUrl, filename)` - Convert data URL to File
   - `uploadPhotosFromDataUrls(photoDataUrls, sessionId)` - Upload from data URLs

2. **`src/hooks/usePhotoUpload.js`** - React hook for upload management
   - `sessionId` - Current session ID
   - `isUploading` - Upload status
   - `uploadError` - Error message
   - `uploadPhotos(photoDataUrls)` - Upload from data URLs
   - `uploadFilesDirect(files)` - Upload File objects
   - `fetchFiles()` - Fetch files for session
   - `resetSession()` - Reset session
   - `setSessionId(newSessionId)` - Set session ID manually

3. **`src/components/PhotoResultPage.jsx`** - Page untuk menampilkan hasil upload
   - Fetch files dari API berdasarkan sessionId (dari URL parameter)
   - Display photos dengan download dan share functionality
   - Route: `/photo-result?sessionId=abc123`

4. **`src/components/PreviewPrint.jsx`** - Updated dengan upload functionality
   - Auto-upload saat component mount
   - Manual upload button
   - QR Code dengan URL ke PhotoResultPage
   - Upload status indicator

### Usage Flow

1. **Photo Capture** → User mengambil foto di `CameraSession`
2. **Photo Selection** → User memilih foto di `PhotoSelection`
3. **Preview & Upload** → Di `PreviewPrint`:
   - Foto otomatis di-upload ke backend
   - QR Code di-generate dengan URL ke PhotoResultPage
   - User bisa scan QR Code untuk melihat hasil
4. **View Results** → Di `PhotoResultPage`:
   - Fetch files dari API berdasarkan sessionId
   - Display semua foto dengan download/share options

### Session Management

- Session ID di-generate otomatis saat aplikasi pertama kali load
- Session ID disimpan di `sessionStorage` dengan key `photobooth_sessionId`
- Session ID bisa di-set manual via URL parameter: `/photo-result?sessionId=abc123`
- Upload status disimpan di `sessionStorage` dengan key `uploaded_{sessionId}`

### File Naming Convention

Files di-upload dengan field names:
- `photo-1` - Merged photostrip result (first file)
- `photo-2`, `photo-3`, etc. - Original photos
- `gif` - GIF animation (if any)

Backend akan menyimpan dengan format:
- `${sessionId}-1.png` - Photostrip result
- `${sessionId}-2.png`, `${sessionId}-3.png` - Original photos
- `${sessionId}-gif.gif` - GIF animation

## Testing

### Test Upload

1. Start backend server di `localhost:3000`
2. Jalankan aplikasi frontend
3. Ambil foto dan lanjut ke PreviewPrint
4. Foto akan otomatis di-upload
5. Scan QR Code atau buka `/photo-result?sessionId={sessionId}`

### Test View

1. Buka `/photo-result?sessionId={sessionId}`
2. Photos akan di-fetch dari API dan ditampilkan
3. User bisa download atau share individual photos

## Error Handling

- Upload errors ditampilkan di UI dengan pesan error
- View errors ditampilkan dengan pesan "No photos found"
- Network errors di-handle dengan try-catch
- API errors di-return dengan format `{ success: false, message: "..." }`

## Security

- API Key dikirim via `X-API-Key` header
- Session ID di-validate (max 100 chars, alphanumeric)
- File type validation di backend
- Rate limiting di backend (100 uploads per 15 min per IP)

