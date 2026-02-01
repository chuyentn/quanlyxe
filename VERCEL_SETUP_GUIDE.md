# 🔧 HƯỚNG DẪN CẤU HÌNH VERCEL - TỪNG BƯỚC

## 📍 Problem

App deploy lên Vercel (https://quanlyxe.vercel.app/) nhưng lỗi 404 vì **thiếu environment variables**

---

## ⚡ Cách nhanh nhất

### **Bước 1: Vào Vercel Dashboard**
```
https://vercel.com/dashboard
```

### **Bước 2: Chọn project `quanlyxe`**

### **Bước 3: Vào Settings → Environment Variables**

### **Bước 4: Add Variable 1 - Supabase URL**
```
Key:   VITE_SUPABASE_URL
Value: https://limplhlzsonfphiprgkx.supabase.co
Environments: ☑️ Production  ☑️ Preview  ☑️ Development
Click: Add
```

### **Bước 5: Add Variable 2 - Supabase Key**
```
Key:   VITE_SUPABASE_PUBLISHABLE_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxpbXBsaGx6c29uZnBoaXByZ2t4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM5MDgyMjEsImV4cCI6MTg5MTY3NDIyMX0.x5UWjfWCxq0z_bB2K8D4Z9L3M6N7O8P9Q0R1S2T3U4
Environments: ☑️ Production  ☑️ Preview  ☑️ Development
Click: Add
```

### **Bước 6: Redo Deployment**

**Cách 1: Qua Vercel Dashboard**
1. Vào **Deployments**
2. Click vào deployment cuối cùng
3. Nhấn **Redeploy**
4. Chọn **Redeploy to Production**

**Cách 2: Push code mới (Automatic)**
```bash
cd d:\GITHUB\quanlyxe
git add .
git commit -m "fix: Vercel deployment"
git push origin main
```
→ Vercel tự động deploy (2-5 phút)

### **Bước 7: Kiểm tra**
```
https://quanlyxe.vercel.app/
```

Phải thấy:
- ✅ Trang login load thành công (không 404)
- ✅ Form có email & password input
- ✅ Có nút "Đăng nhập"

---

## 📸 Visual Step-by-Step

### **Step 1: Dashboard**
```
1. Đăng nhập https://vercel.com
2. Chọn Team hoặc Account của bạn
3. Tìm project "quanlyxe"
4. Click vào nó
```

### **Step 2: Settings**
```
Dashboard → quanlyxe → Settings (tab)
```

### **Step 3: Environment Variables**
```
Settings → Environment Variables
```

### **Step 4: Add First Variable**
```
┌─────────────────────────────────────────────┐
│ Key: VITE_SUPABASE_URL                      │
│ Value: https://limplhlzsonfphiprgkx...      │
│ Environments: [✓] [✓] [✓]                  │
│                                             │
│ [Add] button                                │
└─────────────────────────────────────────────┘
```

### **Step 5: Add Second Variable**
```
┌─────────────────────────────────────────────┐
│ Key: VITE_SUPABASE_PUBLISHABLE_KEY          │
│ Value: eyJhbGciOiJIUzI1NiIs...             │
│ Environments: [✓] [✓] [✓]                  │
│                                             │
│ [Add] button                                │
└─────────────────────────────────────────────┘
```

### **Step 6: Redeploy**
```
Deployments → (chọn deployment cuối) → [Redeploy]
```

---

## ✅ Danh sách kiểm tra

### **Trước deployment**
- [ ] Git push thành công
- [ ] Code có file:
  - [ ] `vercel.json` (updated)
  - [ ] `.env.production` (new)

### **Sau add environment variables**
- [ ] VITE_SUPABASE_URL added
- [ ] VITE_SUPABASE_PUBLISHABLE_KEY added
- [ ] Cả 2 đều có ✓ cho Production

### **Sau redeploy**
- [ ] Status: **Ready** ✅
- [ ] Deployment time: 2-5 minutes
- [ ] URL: https://quanlyxe.vercel.app/ works
- [ ] Trang login load (không 404)

### **Sau test**
- [ ] App hiển thị (không lỗi)
- [ ] Có thể nhập email & password
- [ ] Có thể click nút đăng nhập
- [ ] Có thể đăng nhập thành công

---

## 🔍 Kiểm tra chi tiết

### **1. Environment Variables đã set?**
```
Settings → Environment Variables
↓
Phải thấy 2 variables:
  ✅ VITE_SUPABASE_URL = https://limplhlzsonfphiprgkx...
  ✅ VITE_SUPABASE_PUBLISHABLE_KEY = eyJhbGciOiJIUzI...
```

### **2. Build hoàn thành?**
```
Deployments → (deployment cuối cùng)
↓
Status phải là: Ready (xanh)
```

### **3. App accessible?**
```
https://quanlyxe.vercel.app/
↓
Không lỗi 404
Thấy login form
```

---

## 🐛 Nếu còn lỗi

### **❌ Vẫn lỗi 404**

**Giải pháp:**
1. Xóa Vercel cache:
   - Settings → cog icon
   - "Clear git cache"
2. Redo deployment:
   ```bash
   git push origin main --force-with-lease
   ```

### **❌ Variables không hiển thị**

**Giải pháp:**
1. Refresh page (Cmd+Shift+R)
2. Kiểm tra lại: Settings → Environment Variables
3. Nếu còn mất, add lại từ đầu

### **❌ Build failed**

**Kiểm tra:**
1. Logs tab → xem error
2. Thường là:
   - Missing dependency → `npm install --legacy-peer-deps`
   - Build command sai → `npm run build`
3. Đẩy fix lên GitHub → Vercel redeploy tự động

### **❌ App load nhưng blank**

**Giải pháp:**
1. F12 → Console → check errors
2. Thường là Supabase connection
3. Kiểm tra environment variables lại

---

## 💡 Pro Tips

### **Tip 1: Enable Git Integration**
```
Settings → Git
Deployment Branch: main (hoặc branch bạn dùng)
```
→ Auto-deploy khi push

### **Tip 2: Preview Deployments**
```
Mỗi PR → auto-create preview URL
https://quanlyxe-preview-[branch].vercel.app/
```

### **Tip 3: Rollback nếu cần**
```
Deployments → previous deployment → Promote to Production
```

---

## 📞 Support

Nếu có vấn đề:
1. Kiểm tra Vercel logs: Deployments → Building...
2. Kiểm tra GitHub: Code push thành công?
3. Kiểm tra Environment: Variables đã add?
4. Test local: `npm run dev` → http://localhost:8080 OK?

---

**Expected Timeline:**
- Add variables: 2 phút
- Redeploy: 3-5 phút
- Total: ~7 phút

**Status**: ✅ Ready to deploy
