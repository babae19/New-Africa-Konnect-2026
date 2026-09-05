const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Route Handlers...');

const routesDir = path.join(__dirname, 'routes');
const routeFiles = fs.readdirSync(routesDir).filter(f => f.endsWith('.js'));

let hasError = false;

routeFiles.forEach(file => {
    try {
        const routePath = path.join(routesDir, file);
        const content = fs.readFileSync(routePath, 'utf8');

        // Simple regex check for imports from controllers
        // This isn't perfect but checks if we are requiring something
        // Real validation is best done by trying to require the controller

        console.log(`Checking ${file}...`);

        // Try to require the route file. 
        // Note: This might fail if DB connection is required immediately on load, 
        // so we might need to mock things. But often routes just define router.

        // Instead of requiring route (which might trigger side effects), let's scan controllers.

    } catch (err) {
        console.error(`Error processing ${file}:`, err.message);
    }
});

// Better approach: Check controllers for missing exports vs imports
const controllersDir = path.join(__dirname, 'controllers');
const validationErrors = [];

// Helper to get exported keys from a file
function getExports(filePath) {
    try {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        // Regex to find "exports.name =" or "module.exports = {"
        const exports = [];
        const regex1 = /exports\.(\w+)\s*=/g;
        let match;
        while ((match = regex1.exec(fileContent)) !== null) {
            exports.push(match[1]);
        }

        // basic check for module.exports object style
        if (fileContent.includes('module.exports = {')) {
            const objectBlock = fileContent.split('module.exports = {')[1].split('}')[0];
            const keys = objectBlock.split(',').map(k => k.trim().split(':')[0].trim()).filter(k => k);
            exports.push(...keys);
        }

        return exports;
    } catch (e) {
        return [];
    }
}

// Regex to find requires in routes
function checkRoutes() {
    routeFiles.forEach(rFile => {
        const content = fs.readFileSync(path.join(routesDir, rFile), 'utf8');
        const requireMatches = content.matchAll(/require\(['"]\.\.\/controllers\/([^'"]+)['"]\)/g);

        for (const match of requireMatches) {
            const controllerName = match[1]; // e.g., 'paymentController'
            const controllerPath = path.join(controllersDir, controllerName + '.js');

            if (!fs.existsSync(controllerPath)) {
                console.error(`❌ ${rFile} imports non-existent controller: ${controllerName}`);
                hasError = true;
                continue;
            }

            const realExports = getExports(controllerPath);

            // Find what is destructured: const { foo, bar } = require(...)
            // We look for the line containing this require
            const lines = content.split('\n');
            lines.forEach((line, idx) => {
                if (line.includes(`require('../controllers/${controllerName}')`)) {
                    // unexpected simple parsing
                    const destructured = line.match(/const\s+\{([^}]+)\}\s*=/);
                    if (destructured) {
                        const imports = destructured[1].split(',').map(i => i.trim());
                        imports.forEach(imp => {
                            // alias check: initEscrow: init
                            const name = imp.split(':')[0].trim();
                            if (!realExports.includes(name)) {
                                console.error(`❌ ${rFile}:${idx + 1} imports '${name}' from ${controllerName}, but it assumes export '${name}' which was NOT found in controller exports: [${realExports.slice(0, 5).join(', ')}...]`);
                                hasError = true;
                            }
                        });
                    }
                }
            });
        }
    });
}

checkRoutes();

if (hasError) {
    console.log('\n❌ Found import/export mismatches. This WILL cause "handler must be a function" errors.');
    process.exit(1);
} else {
    console.log('\n✅ No static analysis import errors found.');
}
