import { ConvexHttpClient } from "convex/browser";

const client = new ConvexHttpClient("https://harmless-salamander-44.convex.cloud");

// Get all users
const users = await client.query('admin:getAllUsers', {});
console.log('📋 Users:', JSON.stringify(users, null, 2));

for (const user of users) {
  console.log(`\n🔍 Checking schedule for ${user.name} (${user._id})...`);
  
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  
  for (const day of days) {
    const schedule = await client.query('weeklySchedule:getScheduleByDay', {
      userId: user._id,
      dayOfWeek: day
    });
    
    if (schedule && schedule.length > 0) {
      console.log(`  ${day}: ${schedule.length} items`);
      schedule.forEach((item, i) => {
        console.log(`    ${i+1}. ${item.startTime}-${item.endTime} ${item.activity}`);
      });
    }
  }
}

process.exit(0);
