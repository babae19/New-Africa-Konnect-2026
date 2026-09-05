const { query } = require('../database/db');
const { createExpertProfile } = require('../models/expertModel');

async function backfill() {
    console.log('🚀 Starting expert profile backfill...');

    try {
        // Find all users with role 'expert' who don't have a profile
        const findText = `
            SELECT u.id, u.name, u.email 
            FROM users u
            LEFT JOIN expert_profiles ep ON u.id = ep.user_id
            WHERE u.role = 'expert' AND ep.id IS NULL
        `;

        const result = await query(findText);
        const missingExperts = result.rows;

        console.log(`Found ${missingExperts.length} experts missing profiles.`);

        for (const user of missingExperts) {
            console.log(`Creating profile for ${user.email}...`);
            await createExpertProfile({
                userId: user.id,
                title: 'Professional Expert',
                bio: `Hi, I'm ${user.name}. I'm an expert on Africa Konnect ready to help with your projects.`,
                location: 'Remote',
                skills: [],
                hourlyRate: 50, // Default starting rate
                profileImageUrl: null,
                certifications: [],
                vettingStatus: 'approved'
            });
            console.log(`✅ Created profile for ${user.email}`);
        }

        console.log('✨ Backfill completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Backfill failed:', error);
        process.exit(1);
    }
}

backfill();
