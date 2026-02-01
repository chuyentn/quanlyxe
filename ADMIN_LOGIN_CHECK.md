# 🔐 Hướng dẫn Kiểm tra Đăng nhập Admin

## 📋 Nội dung
1. Cách đăng nhập
2. Kiểm tra quyền admin
3. Test admin account
4. Troubleshooting

---

## 1️⃣ Cách Đăng nhập

### **Bước 1: Truy cập trang đăng nhập**
```
URL: http://localhost:8080/auth
```

### **Bước 2: Nhập thông tin**
- **Email**: Nhập email tài khoản admin
- **Password**: Nhập mật khẩu

### **Bước 3: Nhấn "Đăng nhập"**

---

## 2️⃣ Kiểm tra Quyền Admin

Sau khi đăng nhập thành công, kiểm tra:

### **A. Kiểm tra qua Console Browser**
1. Mở **DevTools** (F12 hoặc Ctrl+Shift+I)
2. Vào tab **Console**
3. Chạy lệnh:
```javascript
// Kiểm tra localStorage
console.log('User Role:', localStorage.getItem('user_role'));

// Kiểm tra session
localStorage.getItem('sb-auth-token') ? console.log('✅ Có session') : console.log('❌ Không có session');
```

### **B. Kiểm tra qua UI**
- Nhìn vào **sidebar** - admin sẽ thấy tất cả menu:
  - ✅ Dashboard
  - ✅ Danh Mục Xe
  - ✅ Tài xế
  - ✅ Khách hàng
  - ✅ Tuyến đường
  - ✅ Điều độc xe
  - ✅ Chi phí
  - ✅ Bảo trì
  - ✅ Báo cáo
  - ✅ Cài đặt
  - ✅ Cảnh báo

- Ngoài ra, admin có thể:
  - Thêm/sửa/xóa dữ liệu
  - Quản lý người dùng
  - Xem toàn bộ báo cáo
  - Cài đặt hệ thống

### **C. Kiểm tra qua Database**
Chạy lệnh SQL trên Supabase:
```sql
-- Kiểm tra user đã đăng nhập
SELECT * FROM auth.users 
WHERE email = 'your-email@example.com';

-- Kiểm tra role của user
SELECT user_id, role FROM public.user_roles 
WHERE user_id = 'user-uuid-here';

-- Kết quả mong đợi cho admin:
-- role = 'admin'
```

---

## 3️⃣ Tạo/Test Admin Account

### **Cách 1: Tạo admin qua Supabase Dashboard**

1. Vào **Authentication** → **Users**
2. Nhấn **Add user** (nếu có)
3. Nhập:
   - Email: `admin@example.com`
   - Password: `AdminPassword123!`
4. Tạo, sau đó gán role:
   ```sql
   INSERT INTO public.user_roles (user_id, role) 
   VALUES ('user-id-here', 'admin');
   ```

### **Cách 2: Dùng test-auth.js Script**
```bash
cd d:\GITHUB\quanlyxe
node scripts/test-auth.js
```

Kết quả sẽ hiển thị:
```
✅ Connection successful
✅ Authentication providers configured
✅ Users table exists
✅ Roles table exists
```

### **Cách 3: Import Demo Data**
```bash
# Chạy seed script với data demo
npm run db:seed
```

---

## 4️⃣ Troubleshooting

### **❌ Không thể đăng nhập**

**Vấn đề 1: "Lỗi 400 - Invalid request"**
- Kiểm tra `.env.local`:
  ```
  VITE_SUPABASE_URL=https://your-project.supabase.co
  VITE_SUPABASE_PUBLISHABLE_KEY=your-key-here
  ```
- Nếu sai, cập nhật lại

**Vấn đề 2: "Tài khoản không tồn tại"**
- Vào **Supabase Dashboard** → **Authentication** → **Users**
- Kiểm tra email đã tồn tại chưa
- Nếu không, tạo mới

**Vấn đề 3: "Mật khẩu sai"**
- Đặt lại password qua Supabase Dashboard:
  1. Vào **Users**
  2. Chọn user
  3. Nhấn **Reset password**

### **❌ Đăng nhập thành công nhưng không thấy admin menu**

**Vấn đề 1: Không có role**
```sql
-- Kiểm tra
SELECT * FROM user_roles WHERE user_id = 'your-id';

-- Nếu không có, thêm:
INSERT INTO user_roles (user_id, role) 
VALUES ('your-id', 'admin');
```

**Vấn đề 2: Cache localStorage**
- Mở DevTools → **Console** → chạy:
```javascript
localStorage.clear();
location.reload();
```

**Vấn đề 3: Role sai**
```sql
-- Cập nhật role
UPDATE user_roles 
SET role = 'admin' 
WHERE user_id = 'your-id';
```

---

## 📝 Kiểm tra Quick

### **Lệnh check nhanh (1 dòng trong Console)**
```javascript
console.log({
  role: localStorage.getItem('user_role'),
  hasSession: !!localStorage.getItem('sb-auth-token'),
  timestamp: new Date().toISOString()
});
```

**Kết quả expected:**
```
{
  role: "admin",
  hasSession: true,
  timestamp: "2026-02-01T..."
}
```

### **Check Supabase nhanh**
```bash
# Kiểm tra connection
curl https://your-project.supabase.co/rest/v1/user_roles \
  -H "apikey: your-key" \
  -H "Authorization: Bearer your-token"
```

---

## 🎯 Tổng kết

| Bước | Hành động | Kết quả mong đợi |
|------|----------|-----------------|
| 1 | Vào `/auth` | Trang login hiện |
| 2 | Nhập email & password | Không lỗi |
| 3 | Nhấn Đăng nhập | Redirect đến Dashboard |
| 4 | Kiểm tra localStorage | `user_role = 'admin'` |
| 5 | Kiểm tra sidebar | Thấy tất cả menu |
| 6 | Test chức năng | Thêm/sửa/xóa hoạt động |

✅ **Nếu tất cả mục trên OK = Admin login thành công!**

---

## 📞 Hỗ trợ

Nếu có vấn đề:
1. Kiểm tra `.env.local` - đúng URL & key?
2. Kiểm tra Supabase - user & role tồn tại?
3. Clear cache - `localStorage.clear()` rồi reload
4. Check Network tab - API response có lỗi?
5. Xem console.log() - có error gì không?

---

**Generated**: February 1, 2026
**Status**: ✅ Production Ready
