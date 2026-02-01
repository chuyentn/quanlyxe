/**
 * Debug script to test Trips API
 * Run this in browser console (F12) to check what's happening
 */

// Test 1: Check if Supabase client is initialized
console.log("Testing Trips tab loading...");

// Test 2: Try fetching trips directly
const testTripsAPI = async () => {
  try {
    // Import Supabase dynamically
    const { supabase } = await import('/src/integrations/supabase/client');
    
    console.log("1️⃣ Supabase client loaded");
    
    // Try to fetch from trip_financials
    const { data, error } = await supabase
      .from('trip_financials')
      .select('*')
      .order('departure_date', { ascending: false });
    
    if (error) {
      console.error("❌ Error fetching trip_financials:", error);
      return;
    }
    
    console.log("✅ Successfully fetched trips:", data);
    console.log("   Total records:", data?.length || 0);
    
  } catch (err) {
    console.error("❌ Exception:", err);
  }
};

// Run test
testTripsAPI();

// Test 3: Check RLS policies
const checkRLS = async () => {
  try {
    const { supabase } = await import('/src/integrations/supabase/client');
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    console.log("Current user:", user?.id);
    
    // Try to fetch trips table directly
    const { data: directData, error: directError } = await supabase
      .from('trips')
      .select('id, trip_code, status')
      .limit(5);
    
    if (directError) {
      console.error("❌ RLS blocking trips table:", directError);
    } else {
      console.log("✅ trips table accessible:", directData);
    }
    
  } catch (err) {
    console.error("❌ RLS check error:", err);
  }
};

console.log("\n--- Running RLS Check ---");
checkRLS();
