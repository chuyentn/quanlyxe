# 🔐 HƯỚNG DẪN KIỂM TRA ĐĂNG NHẬP ADMIN

## 📌 Tóm tắt nhanh

Để kiểm tra admin user có thể đăng nhập được:

1. **Vào trang login**: http://localhost:8080/auth
2. **Nhập email & password admin**
3. **Kiểm tra role = 'admin'**
4. **Kiểm tra thấy toàn bộ menu**

---

## 🚀 CÁCH 1: Test trực tiếp qua UI (Dễ nhất)

### Bước 1: Khởi động app
```bash
cd d:\GITHUB\quanlyxe
npm run dev
```

### Bước 2: Truy cập trang Auth
```
URL: http://localhost:8080/auth
```

### Bước 3: Chọn tab "Đăng nhập"

![Login Form]
- Email: `(nhập email admin)`
- Password: `(nhập password)`

### Bước 4: Nhấn nút "Đăng nhập"

### Bước 5: Kiểm tra kết quả

✅ **Thành công nếu:**
- Không có lỗi
- Redirect đến Dashboard
- Sidebar hiển thị toàn bộ menu:
  - Dashboard
  - Danh Mục Xe
  - Tài xế
  - Khách hàng
  - Tuyến đường
  - Điều độc xe
  - Chi phí
  - Bảo trì
  - Báo cáo
  - Cài đặt
  - Cảnh báo

❌ **Lỗi nếu:**
- Thấy lỗi "Invalid credentials"
- Redirect về Auth page (login sai)
- Sidebar không hiển thị menu (không phải admin)

---

## 🔧 CÁCH 2: Test qua Browser Console (Có chi tiết)

### Bước 1: Đăng nhập
(Làm theo Cách 1, bước 1-4)

### Bước 2: Mở DevTools
```
Nhấn: F12 hoặc Ctrl+Shift+I
```

### Bước 3: Vào tab Console
```
DevTools → Console
```

### Bước 4: Chạy lệnh kiểm tra

#### 4.1 Kiểm tra role
```javascript
localStorage.getItem('user_role')
```

**Kết quả:**
- `"admin"` ✅ OK
- `"manager"` / `"dispatcher"` / etc. ❌ Không phải admin
- `null` ❌ Không có role

#### 4.2 Kiểm tra session
```javascript
!!localStorage.getItem('sb-auth-token')
```

**Kết quả:**
- `true` ✅ Có session
- `false` ❌ Không có session

#### 4.3 Kiểm tra toàn bộ thông tin
```javascript
console.table({
  role: localStorage.getItem('user_role'),
  hasSession: !!localStorage.getItem('sb-auth-token'),
  hasAuthToken: !!localStorage.getItem('sb-auth-token'),
  authData: JSON.parse(localStorage.getItem('sb-auth-token') || '{}')
})
```

### Bước 5: Kiểm tra Network

1. Mở DevTools → Network
2. Reload trang (F5)
3. Kiểm tra request:
   - Tìm `/auth` endpoint
   - Status phải là `200` hoặc `201`
   - Response có chứa `user` object

---

## 🗄️ CÁCH 3: Test qua Supabase SQL (Chính xác nhất)

### Bước 1: Vào Supabase Dashboard
```
URL: https://app.supabase.com
```

### Bước 2: Chọn project của bạn

### Bước 3: Vào SQL Editor
```
Supabase → SQL Editor
```

### Bước 4: Chạy các query sau

#### Query 1: Kiểm tra user tồn tại
```sql
SELECT id, email, created_at, last_sign_in_at 
FROM auth.users 
WHERE email = 'your-admin@example.com';
```

**Kết quả mong đợi:** Hiển thị 1 row với user info

#### Query 2: Kiểm tra role
```sql
SELECT ur.user_id, ur.role, au.email
FROM public.user_roles ur
JOIN auth.users au ON ur.user_id = au.id
WHERE au.email = 'your-admin@example.com';
```

**Kết quả mong đợi:** 
```
user_id     | role  | email
------------|-------|------------------
abc123...   | admin | your-admin@example.com
```

#### Query 3: Kiểm tra admin tồn tại
```sql
SELECT COUNT(*) as admin_count
FROM public.user_roles
WHERE role = 'admin';
```

**Kết quả mong đợi:** `admin_count` > 0

#### Query 4: Liệt kê toàn bộ admin
```sql
SELECT au.email, ur.role
FROM auth.users au
JOIN public.user_roles ur ON au.id = ur.user_id
WHERE ur.role = 'admin';
```

**Kết quả mong đợi:** Danh sách email của các admin

---

## ⚙️ CÁCH 4: Test qua Script Node.js

### Bước 1: Tạo file test
```bash
cd d:\GITHUB\quanlyxe
```

### Bước 2: Chạy script test authentication
```bash
node scripts/test-auth.js
```

### Bước 3: Kiểm tra kết quả

**Kết quả OK:**
```
✅ Connection successful
✅ Authentication providers configured
✅ Users table exists
✅ Roles table exists
```

---

## 🐛 TROUBLESHOOTING

### ❌ Lỗi: "Invalid credentials"

**Nguyên nhân:** Email hoặc password sai

**Cách sửa:**
1. Kiểm tra email đúng chính tả
2. Kiểm tra password đúng chính tả
3. Nếu quên, reset password:
   - Vào Supabase Dashboard
   - Authentication → Users
   - Chọn user → Reset password

### ❌ Lỗi: "Email not confirmed"

**Nguyên nhân:** Email chưa được xác nhận

**Cách sửa:**
1. Kiểm tra email, tìm link xác nhận
2. Hoặc vào Supabase Dashboard
3. Disable email confirmation (Development mode)

### ❌ Đăng nhập thành công nhưng không thấy admin menu

**Nguyên nhân 1:** User không có role

**Cách sửa:**
```sql
-- Chạy trên Supabase SQL Editor
INSERT INTO public.user_roles (user_id, role)
VALUES ('user-id-here', 'admin')
ON CONFLICT (user_id) DO UPDATE
SET role = 'admin';
```

**Nguyên nhân 2:** Role sai

**Cách sửa:**
```sql
-- Cập nhật role thành admin
UPDATE public.user_roles 
SET role = 'admin'
WHERE user_id = 'user-id-here';
```

**Nguyên nhân 3:** Cache localStorage

**Cách sửa:**
```javascript
// Chạy trong Console
localStorage.clear();
location.reload();
```

### ❌ User không tồn tại

**Nguyên nhân:** Email chưa tạo

**Cách sửa:**
1. Vào Supabase Dashboard
2. Authentication → Users
3. Nhấn "Add user"
4. Nhập email & password
5. Lưu
6. Gán role:
```sql
INSERT INTO public.user_roles (user_id, role)
VALUES ('new-user-id', 'admin');
```

---

## ✅ CHECKLIST KIỂM TRA

Tích vào mỗi mục khi hoàn thành:

- [ ] **1. Environment Variables**
  - [ ] `.env.local` có `VITE_SUPABASE_URL`
  - [ ] `.env.local` có `VITE_SUPABASE_PUBLISHABLE_KEY`

- [ ] **2. Database Setup**
  - [ ] Bảng `auth.users` tồn tại
  - [ ] Bảng `public.user_roles` tồn tại

- [ ] **3. User Account**
  - [ ] User tồn tại trong `auth.users`
  - [ ] User có entry trong `user_roles`
  - [ ] User role = `'admin'`

- [ ] **4. Test Login**
  - [ ] Trang login load OK
  - [ ] Có thể nhập email & password
  - [ ] Nút đăng nhập hoạt động
  - [ ] Không lỗi 400/401/403

- [ ] **5. Post-Login**
  - [ ] Redirect đến Dashboard
  - [ ] Sidebar hiển thị toàn bộ menu
  - [ ] Browser console không có lỗi
  - [ ] localStorage có `user_role = 'admin'`

- [ ] **6. Functionality**
  - [ ] Có thể vào Danh Mục Xe
  - [ ] Có thể vào Tài xế
  - [ ] Có thể vào Cài đặt
  - [ ] Có thể thêm/sửa/xóa dữ liệu

---

## 📝 Quick Reference

| Kiểm tra | Lệnh | Kết quả |
|---------|------|--------|
| Role | `localStorage.getItem('user_role')` | `"admin"` |
| Session | `!!localStorage.getItem('sb-auth-token')` | `true` |
| User tồn tại | SQL: `SELECT * FROM auth.users WHERE email = '...'` | 1 row |
| Role admin | SQL: `SELECT * FROM user_roles WHERE role = 'admin'` | > 0 rows |

---

## 🎯 Summary

✅ **Admin login thành công khi:**
1. Trang login hiển thị
2. Nhập email & password → không lỗi
3. Redirect đến Dashboard
4. Sidebar hiển thị toàn bộ menu
5. Browser console không lỗi
6. `localStorage.user_role = 'admin'`

❌ **Admin login thất bại khi:**
1. Lỗi "Invalid credentials" → Email/password sai
2. Lỗi "Email not confirmed" → Email chưa xác nhận
3. Redirect về Auth → Login sai
4. Sidebar không đủ menu → Không phải admin
5. Browser console lỗi 401/403 → Quyền không đủ

---

**Last Updated**: February 1, 2026  
**Status**: ✅ Production Ready
