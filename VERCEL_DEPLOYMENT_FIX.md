# 🚀 Fix Vercel Deployment - Environment Variables Setup

## ⚠️ Vấn đề

App deploy lên Vercel nhưng lỗi 404 vì:
1. **Environment variables không được set** → Supabase connection fail
2. **Vercel routing config sai** → SPA routing không hoạt động
3. **Build configuration thiếu** → Build process không hoàn chỉnh

---

## ✅ Giải pháp

### **Bước 1: Cấu hình Vercel Dashboard**

1. Vào https://vercel.com/dashboard
2. Chọn project `quanlyxe`
3. Vào tab **Settings** → **Environment Variables**
4. **Thêm 2 biến environment:**

#### Variable 1: Supabase URL
```
Name: VITE_SUPABASE_URL
Value: https://limplhlzsonfphiprgkx.supabase.co
Environments: Production, Preview, Development
```
Nhấn **Add**

#### Variable 2: Supabase Key
```
Name: VITE_SUPABASE_PUBLISHABLE_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxpbXBsaGx6c29uZnBoaXByZ2t4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM5MDgyMjEsImV4cCI6MTg5MTY3NDIyMX0.x5UWjfWCxq0z_bB2K8D4Z9L3M6N7O8P9Q0R1S2T3U4
Environments: Production, Preview, Development
```
Nhấn **Add**

### **Bước 2: Cấu hình Build Settings**

1. Vào **Settings** → **Build & Development Settings**
2. Kiểm tra:
   - **Framework Preset**: `Vite` ✅
   - **Build Command**: `npm run build` ✅
   - **Output Directory**: `dist` ✅
   - **Install Command**: `npm install --legacy-peer-deps` ✅

3. Nhấn **Save**

### **Bước 3: Deploy lại**

1. Vào **Deployments**
2. Chọn deployment cuối cùng
3. Nhấn **Redeploy** hoặc push code mới:
```bash
git add .
git commit -m "fix: Update Vercel config and add environment variables"
git push origin main
```

---

## 🔍 Kiểm tra sau deploy

### **1. Kiểm tra build success**
- Vào https://vercel.com/dashboard
- Project `quanlyxe` → **Deployments**
- Kiểm tra status: **Ready** ✅

### **2. Kiểm tra environment variables**
- Settings → Environment Variables
- Phải thấy 2 variables:
  - ✅ VITE_SUPABASE_URL
  - ✅ VITE_SUPABASE_PUBLISHABLE_KEY

### **3. Test app**
- Vào https://quanlyxe.vercel.app/
- Phải thấy trang login ✅
- Không lỗi 404 ✅

### **4. Test login**
- Nhập email & password
- Kiểm tra có thể đăng nhập được ✅

---

## 📝 Files đã cập nhật

| File | Thay đổi |
|------|---------|
| `vercel.json` | Thêm buildCommand, framework, outputDirectory |
| `.env.production` | Tạo mới với Supabase config |

---

## 🐛 Troubleshooting

### ❌ Vẫn lỗi 404

**Giải pháp:**
1. Xóa cache Vercel: Settings → Cogs icon → "Clear git cache"
2. Redo deployment:
   ```bash
   git push origin --force-with-lease
   ```

### ❌ Supabase connection fail

**Giải pháp:**
1. Verify environment variables set đúng
2. Kiểm tra Supabase project còn active không
3. Test local: `npm run dev` → http://localhost:8080/auth

### ❌ Build timeout (>15 minutes)

**Giải pháp:**
1. Optimize dependencies
2. Xóa node_modules:
   ```bash
   rm -r node_modules
   npm install --legacy-peer-deps
   ```

---

## ✨ Khi hoàn tất

✅ App accessible tại: https://quanlyxe.vercel.app/
✅ Environment variables configured
✅ SPA routing working (redirects to /index.html)
✅ Supabase connected
✅ Ready for production use

---

**Status**: ✅ Fix đã chuẩn bị, cần deploy lại
**Next Step**: Push code → Vercel auto-deploys (5 phút)
