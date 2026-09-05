const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: { rejectUnauthorized: false }
});

const sampleExperts = [
    {
        name: "Sarah Jenkins",
        email: "sarah.j@example.com",
        title: "Senior Full Stack Developer",
        bio: "Experienced developer with 8 years in React and Node.js ecosystems.",
        skills: ["React", "Node.js", "TypeScript", "AWS"],
        rate: 85,
        location: "Lagos, Nigeria"
    },
    {
        name: "David Okafor",
        email: "david.o@example.com",
        title: "DevOps Engineer",
        bio: "Specializing in cloud infrastructure, CI/CD pipelines, and containerization.",
        skills: ["Docker", "Kubernetes", "AWS", "Terraform"],
        rate: 95,
        location: "Nairobi, Kenya"
    },
    {
        name: "Amara Diop",
        email: "amara.d@example.com",
        title: "UI/UX Designer",
        bio: "Passionate about creating intuitive and beautiful user experiences.",
        skills: ["Figma", "Adobe XD", "Prototyping", "User Research"],
        rate: 70,
        location: "Dakar, Senegal"
    }
];

async function seed() {
    console.log('🌱 Seeding database...');

    try {
        const client = await pool.connect();

        // Cleanup existing data
        await client.query('TRUNCATE users, expert_profiles, projects, contracts CASCADE');
        console.log('🧹 Cleaned existing data');

        const hashedPassword = await bcrypt.hash('password123', 10);

        // Experts
        for (const expert of sampleExperts) {
            // 1. Create User
            const userRes = await client.query(`
                INSERT INTO users (name, email, password_hash, role)
                VALUES ($1, $2, $3, 'expert')
                RETURNING id
            `, [expert.name, expert.email, hashedPassword]);

            const userId = userRes.rows[0].id;

            // 2. Create Profile
            await client.query(`
                INSERT INTO expert_profiles (
                    user_id, title, bio, location, skills, hourly_rate, 
                    vetting_status
                )
                VALUES ($1, $2, $3, $4, $5, $6, 'approved')
            `, [
                userId, expert.title, expert.bio, expert.location,
                expert.skills, expert.rate
            ]);

            console.log(`Created expert: ${expert.name}`);
        }

        // Client
        await client.query(`
            INSERT INTO users (name, email, password_hash, role)
            VALUES ('Demo Client', 'client@example.com', $1, 'client')
        `, [hashedPassword]);
        console.log('Created client: Demo Client');

        console.log('✅ Seeding complete!');
        client.release();
        process.exit(0);

    } catch (err) {
        console.error('❌ Seeding failed:', err);
        process.exit(1);
    }
}

seed();
