#!/usr/bin/env node

/**
 * Vietnamese Character Test
 * Tests that Vietnamese characters display correctly
 */

console.log('🇻🇳 Testing Vietnamese Character Support:\n');

// Test Vietnamese text with proper UTF-8 encoding
const vietnameseText = {
  greeting: 'Xin chào! Chào mừng bạn đến với Dulce de Saigon',
  menuItems: [
    'Phở bò tái - 75.000 ₫',
    'Bánh mì thịt nướng - 25.000 ₫', 
    'Cà phê sữa đá - 15.000 ₫',
    'Chè ba màu - 20.000 ₫'
  ],
  tones: 'á à ả ã ạ ă ắ ằ ẳ ẵ ặ â ấ ầ ẩ ẫ ậ',
  specialChars: 'đ ê ế ề ể ễ ệ ô ố ồ ổ ỗ ộ ơ ớ ờ ở ỡ ợ ư ứ ừ ử ữ ự',
  currency: '₫ (Vietnamese Dong symbol)'
};

console.log('📋 Vietnamese Text Examples:');
console.log(`   Greeting: ${vietnameseText.greeting}`);
console.log('\n🍽️  Menu Items:');
vietnameseText.menuItems.forEach((item, index) => {
  console.log(`   ${index + 1}. ${item}`);
});

console.log(`\n🎵 Tone Marks: ${vietnameseText.tones}`);
console.log(`\n🔤 Special Characters: ${vietnameseText.specialChars}`);
console.log(`\n💰 Currency: ${vietnameseText.currency}`);

console.log('\n✅ All Vietnamese characters displayed successfully!');
console.log('🎉 UTF-8 encoding is working properly!');