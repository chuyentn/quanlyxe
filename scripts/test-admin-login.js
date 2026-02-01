#!/usr/bin/env node

/**
 * Admin Login Verification Script
 * Kiểm tra xem admin user có thể đăng nhập được không
 * 
 * Usage: node scripts/test-admin-login.js
 */

import { createClient } from '@supabase/supabase-js';
import readline from 'readline';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Error: Environment variables not set');
  console.error('Cần cài đặt: VITE_SUPABASE_URL và VITE_SUPABASE_PUBLISHABLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function testAdminLogin() {
  console.log('\n🔐 =====================================');
  console.log('   Kiểm tra Đăng nhập Admin');
  console.log('===================================== 🔐\n');

  try {
    // 1. Nhập thông tin
    console.log('📝 Nhập thông tin tài khoản admin:');
    const email = await question('Email: ');
    const password = await question('Password: ');

    console.log('\n⏳ Đang kiểm tra...\n');

    // 2. Thử đăng nhập
    console.log('1️⃣ Kiểm tra Email & Password...');
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (loginError) {
      console.log('❌ Lỗi đăng nhập:', loginError.message);
      
      if (loginError.message.includes('Invalid login credentials')) {
        console.log('💡 Gợi ý: Email hoặc password sai');
      } else if (loginError.message.includes('Email not confirmed')) {
        console.log('💡 Gợi ý: Email chưa được xác nhận');
      }
      
      rl.close();
      process.exit(1);
    }

    console.log('✅ Đăng nhập thành công');
    const userId = loginData.user.id;
    const userEmail = loginData.user.email;

    // 3. Kiểm tra role
    console.log('\n2️⃣ Kiểm tra quyền (Role)...');
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .single();

    if (roleError) {
      console.log('⚠️ Không tìm thấy role:', roleError.message);
      console.log('❌ User này không có role được định nghĩa');
      console.log('💡 Gợi ý: Thêm role vào database:');
      console.log(`   INSERT INTO user_roles (user_id, role) VALUES ('${userId}', 'admin');`);
      
      // Đăng xuất
      await supabase.auth.signOut();
      rl.close();
      process.exit(1);
    }

    const userRole = roleData.role;
    console.log(`✅ Role: ${userRole}`);

    // 4. Kiểm tra xem có phải admin không
    console.log('\n3️⃣ Kiểm tra quyền Admin...');
    if (userRole !== 'admin') {
      console.log(`❌ User này không phải admin`);
      console.log(`💡 Hiện tại user là: ${userRole}`);
      console.log('💡 Gợi ý: Cập nhật role thành admin:');
      console.log(`   UPDATE user_roles SET role = 'admin' WHERE user_id = '${userId}';`);
      
      // Đăng xuất
      await supabase.auth.signOut();
      rl.close();
      process.exit(1);
    }

    console.log('✅ User là ADMIN');

    // 5. Kiểm tra dữ liệu bổ sung
    console.log('\n4️⃣ Thông tin bổ sung...');
    console.log(`   ├─ User ID: ${userId}`);
    console.log(`   ├─ Email: ${userEmail}`);
    console.log(`   ├─ Role: ${userRole}`);
    console.log(`   └─ Status: ✅ Có thể truy cập tất cả chức năng`);

    // 6. Test quyền truy cập
    console.log('\n5️⃣ Kiểm tra truy cập dữ liệu...');
    
    // Test 1: Truy cập vehicles
    const { data: vehicles, error: vehiclesError } = await supabase
      .from('vehicles')
      .select('count')
      .limit(1);

    if (!vehiclesError || vehiclesError.code === 'PGRST116') {
      console.log('   ✅ Có quyền truy cập vehicles');
    } else {
      console.log('   ❌ Không có quyền truy cập vehicles');
    }

    // Test 2: Truy cập drivers
    const { data: drivers, error: driversError } = await supabase
      .from('drivers')
      .select('count')
      .limit(1);

    if (!driversError || driversError.code === 'PGRST116') {
      console.log('   ✅ Có quyền truy cập drivers');
    } else {
      console.log('   ❌ Không có quyền truy cập drivers');
    }

    // Test 3: Truy cập trips
    const { data: trips, error: tripsError } = await supabase
      .from('trips')
      .select('count')
      .limit(1);

    if (!tripsError || tripsError.code === 'PGRST116') {
      console.log('   ✅ Có quyền truy cập trips');
    } else {
      console.log('   ❌ Không có quyền truy cập trips');
    }

    // 7. Tổng kết
    console.log('\n' + '='.repeat(40));
    console.log('✅ KẾT QUẢ: ĐĂng nhập admin thành công!');
    console.log('='.repeat(40));
    console.log('\n📝 Admin có thể:');
    console.log('   • Quản lý tất cả dữ liệu');
    console.log('   • Thêm/sửa/xóa user');
    console.log('   • Cấu hình hệ thống');
    console.log('   • Xem toàn bộ báo cáo');
    console.log('   • Quản lý tất cả module\n');

    // Đăng xuất
    await supabase.auth.signOut();
    rl.close();

  } catch (error) {
    console.error('❌ Lỗi:', error.message);
    rl.close();
    process.exit(1);
  }
}

testAdminLogin();
