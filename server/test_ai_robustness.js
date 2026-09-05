const { extractJSON } = require('./controllers/aiController');

const testCases = [
    {
        name: "Clean JSON",
        input: '{"title": "Test Project", "description": "A test project."}',
        expected: "Test Project"
    },
    {
        name: "Markdown JSON block",
        input: 'Sure, here is your project:\n```json\n{"title": "Markdown Project", "description": "Markdown test."}\n```\nHope this helps!',
        expected: "Markdown Project"
    },
    {
        name: "JSON with preamble",
        input: 'The project details are: {"title": "Preamble Project", "description": "Preamble test."}',
        expected: "Preamble Project"
    },
    {
        name: "Malformed with braces",
        input: 'Random text { not json } more text {"title": "Brace Project"}',
        expected: "Brace Project"
    }
];

console.log('--- Testing AI JSON Extraction ---');
let passed = 0;

testCases.forEach(tc => {
    try {
        const result = extractJSON(tc.input);
        if (result && result.title === tc.expected) {
            console.log(`✅ [PASS] ${tc.name}`);
            passed++;
        } else {
            console.log(`❌ [FAIL] ${tc.name}`);
            console.log('   Input:', tc.input);
            console.log('   Result:', JSON.stringify(result));
        }
    } catch (e) {
        console.log(`❌ [ERROR] ${tc.name}:`, e.message);
    }
});

console.log(`\nResults: ${passed}/${testCases.length} passed.`);
if (passed === testCases.length) {
    process.exit(0);
} else {
    process.exit(1);
}
