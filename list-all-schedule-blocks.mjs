import { ConvexHttpClient } from "convex/browser";

const client = new ConvexHttpClient("https://harmless-salamander-44.convex.cloud");

// Try raw HTTP to list all weeklySchedule items
const result = await fetch('https://harmless-salamander-44.convex.cloud/api/query', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        path: 'weeklySchedule:getAllScheduleBlocks',
        args: {}
    })
});

const data = await result.json();

if (data.status === 'error') {
    console.log('Error:', data.errorMessage);
    console.log('\nLet me try a different approach - listing users first...\n');
    
    // Try to list all entries directly via the admin endpoint
    const adminResult = await fetch('https://harmless-salamander-44.convex.cloud/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            path: 'admin:listAllScheduleBlocks',
            args: {}
        })
    });
    
    const adminData = await adminResult.json();
    console.log('Admin query result:', JSON.stringify(adminData, null, 2));
} else {
    console.log('Success! Found schedule blocks:');
    console.log(JSON.stringify(data, null, 2));
}

process.exit(0);
