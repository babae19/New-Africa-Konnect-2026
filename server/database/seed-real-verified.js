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

const experts = [
    {
        name: "Chioma Eze",
        email: "chioma.eze@example.com",
        title: "Senior React Native Developer",
        bio: "7+ years building high-performance mobile apps for fintech and healthcare startups. Expert in React Native, Redux, and TypeScript.",
        skills: ["React Native", "TypeScript", "Redux", "Mobile Development", "Android", "iOS"],
        rate: 55,
        location: "Lagos, Nigeria",
        availability: "available"
    },
    {
        name: "Kwame Osei",
        email: "kwame.osei@example.com",
        title: "Full Stack Python/Django Engineer",
        bio: "Specializing in scalable backend systems and RESTful APIs. Proficiency in Django, PostgreSQL, and AWS deployment.",
        skills: ["Python", "Django", "PostgreSQL", "AWS", "Docker", "API Design"],
        rate: 65,
        location: "Accra, Ghana",
        availability: "available"
    },
    {
        name: "Amina Diallo",
        email: "amina.diallo@example.com",
        title: "UI/UX Designer & Product Strategist",
        bio: "Creating user-centric designs with a focus on accessibility and conversion. Skilled in Figma, Adobe Suite, and User Research.",
        skills: ["Figma", "UI/UX", "Product Design", "Wireframing", "Prototyping"],
        rate: 45,
        location: "Dakar, Senegal",
        availability: "busy"
    },
    {
        name: "Sipho Dlamini",
        email: "sipho.d@example.com",
        title: "DevOps & Cloud Architect",
        bio: "Helping companies automate deployment pipelines and secure cloud infrastructure. Certified AWS Solutions Architect.",
        skills: ["DevOps", "AWS", "Kubernetes", "Terraform", "CI/CD", "Linux"],
        rate: 90,
        location: "Johannesburg, South Africa",
        availability: "available"
    },
    {
        name: "Zahra Ahmed",
        email: "zahra.a@example.com",
        title: "Data Scientist & AI Specialist",
        bio: "Turning data into actionable insights. Experience with Machine Learning models, NLP, and Python data stack (Pandas, Scikit-learn).",
        skills: ["Data Science", "Python", "Machine Learning", "NLP", "Pandas", "SQL"],
        rate: 80,
        location: "Cairo, Egypt",
        availability: "available"
    },
    {
        name: "John Kamau",
        email: "john.kamau@example.com",
        title: "Frontend Developer (Vue.js/React)",
        bio: "Passionate about pixel-perfect implementations and smooth animations. Experienced with modern frontend frameworks.",
        skills: ["Vue.js", "React", "JavaScript", "HTML5", "CSS3", "Tailwind CSS"],
        rate: 40,
        location: "Nairobi, Kenya",
        availability: "available"
    },
    {
        name: "Fatima Sow",
        email: "fatima.s@example.com",
        title: "Digital Marketing Specialist",
        bio: "Driving growth through SEO, SEM, and content marketing strategies. Helping brands find their voice in the digital space.",
        skills: ["SEO", "Digital Marketing", "Content Strategy", "Google Analytics", "Social Media"],
        rate: 35,
        location: "Bamako, Mali",
        availability: "available"
    },
    {
        name: "Samuel Mensah",
        email: "samuel.m@example.com",
        title: "Blockchain Developer",
        bio: "Building decentralized applications (dApps) and smart contracts on Ethereum and Solana.",
        skills: ["Blockchain", "Solidity", "Smart Contracts", "Ethereum", "Web3.js"],
        rate: 100,
        location: "Kumasi, Ghana",
        availability: "available"
    },
    {
        name: "Ngozi Obi",
        email: "ngozi.o@example.com",
        title: "Technical Project Manager",
        bio: "Agile certified project manager with a track record of delivering software projects on time and within budget.",
        skills: ["Project Management", "Agile", "Scrum", "Jira", "Team Leadership"],
        rate: 60,
        location: "Abuja, Nigeria",
        availability: "busy"
    },
    {
        name: "Tariq Hossam",
        email: "tariq.h@example.com",
        title: "Cybersecurity Analyst",
        bio: "Protecting digital assets through penetration testing, vulnerability assessment, and security auditing.",
        skills: ["Cybersecurity", "Penetration Testing", "Security Audit", "Network Security"],
        rate: 85,
        location: "Alexandria, Egypt",
        availability: "available"
    }
];

async function seed() {
    console.log('🌱 Seeding database with REAL verified experts...');

    try {
        const client = await pool.connect();

        // Cleanup existing data
        console.log('🧹 Cleaning existing users and profiles...');
        await client.query('TRUNCATE users, expert_profiles, projects, contracts, messages, notifications, tasks CASCADE');

        const expertPassword = await bcrypt.hash('password123', 10);
        const clientPassword = await bcrypt.hash('client123', 10);

        // Seed Experts
        for (const expert of experts) {
            // 1. Create User
            const userRes = await client.query(`
                INSERT INTO users (name, email, password_hash, role, email_verified)
                VALUES ($1, $2, $3, 'expert', true)
                RETURNING id
            `, [expert.name, expert.email, expertPassword]);

            const userId = userRes.rows[0].id;

            // 2. Create Profile
            await client.query(`
                INSERT INTO expert_profiles (
                    user_id, title, bio, location, skills, hourly_rate, 
                    vetting_status, profile_completeness, availability_status
                )
                VALUES ($1, $2, $3, $4, $5, $6, 'approved', 100, $7)
            `, [
                userId, expert.title, expert.bio, expert.location,
                expert.skills, expert.rate, expert.availability
            ]);

            console.log(`✅ Created verified expert: ${expert.name}`);
        }

        // Seed Client
        const clientRes = await client.query(`
            INSERT INTO users (name, email, password_hash, role, email_verified)
            VALUES ('Global Tech Solutions', 'client@example.com', $1, 'client', true)
            RETURNING id
        `, [clientPassword]);

        console.log('✅ Created client: Global Tech Solutions (client@example.com / client123)');

        console.log('🚀 Seeding complete! Database is ready for Quality Control.');
        client.release();
        process.exit(0);

    } catch (err) {
        console.error('❌ Seeding failed:', err);
        process.exit(1);
    }
}

seed();
