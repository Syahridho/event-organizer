# Cara Test Performance dengan Production Build

## ⚠️ PENTING: Development vs Production

**Masalah Anda**: Test performance saat `npm run dev` running
- Development mode = NO optimization
- Performance score akan BURUK di dev mode

**Solusi**: Test dengan production build

## 🚀 Cara Test Performance yang Benar

### Opsi 1: Test Production Build (RECOMMENDED)

#### Step 1: Build Production
```bash
npm run build
```

#### Step 2: Gunakan Production Build
Production build sudah ada di `public/build/`. Laravel otomatis akan menggunakannya jika `npm run dev` tidak running.

#### Step 3: Stop Development Server
```bash
# Stop npm run dev (Ctrl+C di terminal)
```

#### Step 4: Test dengan Lighthouse
```
1. Pastikan php artisan serve masih running
2. Buka http://localhost:8000
3. F12 → Lighthouse → Performance
4. Analyze page load
```

### Opsi 2: Test di Production Environment

Deploy ke production server dan test di sana.

## 🔍 Mengapa Development Mode Lambat?

| Feature | Development | Production |
|---------|-------------|------------|
| Minification | ❌ No | ✅ Yes |
| Compression | ❌ No | ✅ Yes (gzip/brotli) |
| Code Splitting | ⚠️ Minimal | ✅ Optimal |
| Source Maps | ✅ Yes (large) | ❌ No |
| HMR | ✅ Yes (overhead) | ❌ No |
| Console.log | ✅ Kept | ❌ Removed |
| Bundle Size | ~5-10 MB | ~400 KB |

## 📊 Expected Scores

### Development Mode (npm run dev)
- Performance: 20-40 ❌
- Bundle: ~5-10 MB
- Load time: 5-10s

### Production Build (npm run build)
- Performance: 85-95 ✅
- Bundle: ~400 KB (gzipped)
- Load time: 1-2s

## ✅ Checklist untuk Test Performance

- [ ] Stop `npm run dev`
- [ ] Run `npm run build`
- [ ] Verify build completed
- [ ] Clear browser cache
- [ ] Test di incognito mode
- [ ] Run Lighthouse
- [ ] Check score

## 🎯 Action Plan

### Sekarang:
```bash
# 1. Build production
npm run build

# 2. Stop npm run dev (Ctrl+C)

# 3. Test di browser
# Buka http://localhost:8000
# Run Lighthouse
```

### Untuk Development:
```bash
# Gunakan npm run dev untuk development
npm run dev

# Tapi JANGAN test performance saat dev mode!
```

### Untuk Production Testing:
```bash
# Build dulu
npm run build

# Stop dev server
# Test dengan Lighthouse
```

## 🐛 Troubleshooting

### "Vite manifest not found"
```bash
# Build production dulu
npm run build
```

### "Performance masih buruk"
1. Pastikan npm run dev sudah di-stop
2. Clear browser cache (Ctrl+Shift+Del)
3. Test di incognito mode
4. Verify production build digunakan (check Network tab, file harus dari /build/)

### "CSS/JS tidak load"
```bash
# Rebuild
npm run build

# Clear Laravel cache
php artisan cache:clear
php artisan view:clear
```

## 📝 Summary

**JANGAN test performance saat development mode!**

**Workflow yang benar:**
1. Development: `npm run dev` (untuk coding)
2. Testing Performance: `npm run build` + stop dev server (untuk test)
3. Production: `npm run build` + deploy (untuk production)

**Sekarang coba:**
1. Stop `npm run dev` (Ctrl+C)
2. Production build sudah ada (kita sudah build tadi)
3. Test lagi dengan Lighthouse
4. Score seharusnya 85-95! 🚀
