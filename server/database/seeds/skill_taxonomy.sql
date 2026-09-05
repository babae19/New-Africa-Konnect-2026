-- Seed Data: Skill Taxonomy
-- Created: 2026-01-07

-- Clear existing data
TRUNCATE TABLE skill_taxonomy;

-- Web Development
INSERT INTO skill_taxonomy (category, subcategory, skill_name, description) VALUES
('Web Development', 'Frontend', 'React', 'React.js framework for building user interfaces'),
('Web Development', 'Frontend', 'Vue.js', 'Progressive JavaScript framework'),
('Web Development', 'Frontend', 'Angular', 'TypeScript-based web application framework'),
('Web Development', 'Frontend', 'HTML/CSS', 'Core web markup and styling'),
('Web Development', 'Frontend', 'JavaScript', 'Core JavaScript programming'),
('Web Development', 'Frontend', 'TypeScript', 'Typed superset of JavaScript'),
('Web Development', 'Backend', 'Node.js', 'JavaScript runtime for server-side development'),
('Web Development', 'Backend', 'Python/Django', 'Python web framework'),
('Web Development', 'Backend', 'Python/Flask', 'Lightweight Python web framework'),
('Web Development', 'Backend', 'PHP/Laravel', 'PHP web application framework'),
('Web Development', 'Backend', 'Ruby on Rails', 'Ruby web application framework'),
('Web Development', 'Backend', 'Java/Spring', 'Java enterprise framework'),
('Web Development', 'Full Stack', 'MERN Stack', 'MongoDB, Express, React, Node.js'),
('Web Development', 'Full Stack', 'MEAN Stack', 'MongoDB, Express, Angular, Node.js'),
('Web Development', 'Full Stack', 'Next.js', 'React framework for production'),

-- Mobile Development
('Mobile Development', 'iOS', 'Swift', 'iOS native development'),
('Mobile Development', 'iOS', 'Objective-C', 'iOS native development (legacy)'),
('Mobile Development', 'Android', 'Kotlin', 'Android native development'),
('Mobile Development', 'Android', 'Java', 'Android native development'),
('Mobile Development', 'Cross-Platform', 'React Native', 'Cross-platform mobile development'),
('Mobile Development', 'Cross-Platform', 'Flutter', 'Google''s UI toolkit for mobile'),
('Mobile Development', 'Cross-Platform', 'Ionic', 'Hybrid mobile app framework'),

-- Data Science & AI
('Data Science', 'Machine Learning', 'TensorFlow', 'Machine learning framework'),
('Data Science', 'Machine Learning', 'PyTorch', 'Deep learning framework'),
('Data Science', 'Machine Learning', 'Scikit-learn', 'Machine learning library'),
('Data Science', 'Data Analysis', 'Python/Pandas', 'Data manipulation and analysis'),
('Data Science', 'Data Analysis', 'R', 'Statistical computing and graphics'),
('Data Science', 'Data Visualization', 'Tableau', 'Business intelligence and analytics'),
('Data Science', 'Data Visualization', 'Power BI', 'Microsoft business analytics'),
('Data Science', 'Big Data', 'Apache Spark', 'Unified analytics engine'),
('Data Science', 'Big Data', 'Hadoop', 'Distributed storage and processing'),

-- Design
('Design', 'UI/UX Design', 'Figma', 'Collaborative design tool'),
('Design', 'UI/UX Design', 'Adobe XD', 'UI/UX design and prototyping'),
('Design', 'UI/UX Design', 'Sketch', 'Digital design toolkit'),
('Design', 'Graphic Design', 'Adobe Photoshop', 'Image editing and design'),
('Design', 'Graphic Design', 'Adobe Illustrator', 'Vector graphics editor'),
('Design', 'Graphic Design', 'CorelDRAW', 'Vector graphics editor'),
('Design', '3D Design', 'Blender', '3D creation suite'),
('Design', '3D Design', 'AutoCAD', 'Computer-aided design'),

-- DevOps & Cloud
('DevOps', 'Cloud Platforms', 'AWS', 'Amazon Web Services'),
('DevOps', 'Cloud Platforms', 'Azure', 'Microsoft Azure'),
('DevOps', 'Cloud Platforms', 'Google Cloud', 'Google Cloud Platform'),
('DevOps', 'Containerization', 'Docker', 'Container platform'),
('DevOps', 'Containerization', 'Kubernetes', 'Container orchestration'),
('DevOps', 'CI/CD', 'Jenkins', 'Automation server'),
('DevOps', 'CI/CD', 'GitHub Actions', 'CI/CD platform'),
('DevOps', 'Infrastructure', 'Terraform', 'Infrastructure as code'),
('DevOps', 'Infrastructure', 'Ansible', 'Automation platform'),

-- Database
('Database', 'SQL', 'PostgreSQL', 'Advanced open-source database'),
('Database', 'SQL', 'MySQL', 'Popular open-source database'),
('Database', 'SQL', 'Microsoft SQL Server', 'Enterprise database'),
('Database', 'NoSQL', 'MongoDB', 'Document database'),
('Database', 'NoSQL', 'Redis', 'In-memory data structure store'),
('Database', 'NoSQL', 'Cassandra', 'Distributed NoSQL database'),

-- Business & Marketing
('Business', 'Project Management', 'Agile/Scrum', 'Agile project management'),
('Business', 'Project Management', 'Jira', 'Project tracking software'),
('Business', 'Digital Marketing', 'SEO', 'Search engine optimization'),
('Business', 'Digital Marketing', 'Google Ads', 'Online advertising platform'),
('Business', 'Digital Marketing', 'Social Media Marketing', 'Social media strategy'),
('Business', 'Content', 'Content Writing', 'Professional writing'),
('Business', 'Content', 'Copywriting', 'Marketing and advertising copy'),

-- Blockchain & Web3
('Blockchain', 'Smart Contracts', 'Solidity', 'Ethereum smart contract language'),
('Blockchain', 'Smart Contracts', 'Rust', 'Solana/Polkadot development'),
('Blockchain', 'Web3', 'Web3.js', 'Ethereum JavaScript API'),
('Blockchain', 'Web3', 'Ethers.js', 'Ethereum library'),

-- Cybersecurity
('Cybersecurity', 'Security', 'Penetration Testing', 'Security testing'),
('Cybersecurity', 'Security', 'Network Security', 'Network protection'),
('Cybersecurity', 'Security', 'Application Security', 'Secure coding practices');
