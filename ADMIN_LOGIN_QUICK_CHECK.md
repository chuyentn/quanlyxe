# 🔐 TÓM TẮT KIỂM TRA ĐĂNG NHẬP ADMIN

## ⚡ Cách nhanh nhất (30 giây)

### 1. **Khởi động app**
```bash
npm run dev
```

### 2. **Truy cập login**
```
http://localhost:8080/auth
```

### 3. **Đăng nhập với admin account**
- Email: `(email của admin)`
- Password: `(password của admin)`

### 4. **Kiểm tra kết quả**
- ✅ Không lỗi → Thành công
- ✅ Thấy tất cả menu → Là admin
- ❌ Lỗi hoặc menu không đủ → Có vấn đề

---

## 📋 3 Cách kiểm tra chi tiết

### **Cách 1: Kiểm tra qua UI (Dễ nhất)**
1. Mở http://localhost:8080/auth
2. Login với email & password
3. Mở DevTools (F12) → Console
4. Chạy lệnh:
```javascript
localStorage.getItem('user_role')
```
Kết quả phải là: `"admin"`

### **Cách 2: Kiểm tra qua Database**
Vào Supabase SQL Editor, chạy:
```sql
SELECT au.email, ur.role
FROM auth.users au
JOIN public.user_roles ur ON au.id = ur.user_id
WHERE ur.role = 'admin';
```
Kiểm tra email có trong kết quả không?

### **Cách 3: Kiểm tra qua Script**
```bash
node scripts/test-auth.js
```

---

## 🔧 Nếu có lỗi

| Lỗi | Nguyên nhân | Cách sửa |
|-----|-----------|---------|
| "Invalid credentials" | Email/password sai | Kiểm tra lại email & password |
| Redirect về Auth | Login sai | Kiểm tra email & password |
| Không thấy menu | Không phải admin | Chạy SQL: `UPDATE user_roles SET role = 'admin' WHERE user_id = '...'` |
| Cache issues | Cache localStorage | Chạy: `localStorage.clear(); location.reload();` |

---

## 📚 Tài liệu chi tiết

- **[CHECK_ADMIN_LOGIN.md](CHECK_ADMIN_LOGIN.md)** - Hướng dẫn chi tiết (Tiếng Việt)
- **[ADMIN_LOGIN_CHECK.md](ADMIN_LOGIN_CHECK.md)** - Hướng dẫn chi tiết (Tiếng Anh)
- **[supabase/admin-login-check.sql](supabase/admin-login-check.sql)** - SQL queries kiểm tra

---

## ✅ Khi thành công, admin có thể:

- ✅ Đăng nhập thành công
- ✅ Thấy Dashboard
- ✅ Thấy Danh Mục Xe, Tài xế, Khách hàng, v.v...
- ✅ Thêm/sửa/xóa dữ liệu
- ✅ Quản lý người dùng
- ✅ Cấu hình hệ thống

---

**Tất cả hướng dẫn đã được tạo. Chọn cách kiểm tra phù hợp nhất!** 🎯
