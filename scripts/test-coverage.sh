#!/bin/bash

# Test Coverage Report Generator
# Runs tests with coverage and generates a detailed report

set -e

echo "🧪 Agent-Builder Test Coverage Report"
echo "======================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Clean previous coverage
echo "🧹 Cleaning previous coverage data..."
rm -rf coverage

# Run tests with coverage
echo ""
echo "🏃 Running tests with coverage..."
echo ""

npm test -- --coverage --reporter=verbose 2>&1 | tee test-output.log

# Check if tests passed
if [ ${PIPESTATUS[0]} -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ All tests passed!${NC}"
else
    echo ""
    echo -e "${RED}❌ Some tests failed!${NC}"
    exit 1
fi

# Check if coverage directory exists
if [ -d "coverage" ]; then
    echo ""
    echo "📊 Coverage Summary:"
    echo "==================="

    # Extract coverage from lcov-report if available
    if [ -f "coverage/lcov-report/index.html" ]; then
        echo ""
        echo "📈 HTML Coverage Report: coverage/lcov-report/index.html"

        # Try to open in browser (macOS)
        if [[ "$OSTYPE" == "darwin"* ]]; then
            echo "🌐 Opening coverage report in browser..."
            open coverage/lcov-report/index.html
        fi
    fi

    # Extract coverage from JSON report
    if [ -f "coverage/coverage-summary.json" ]; then
        echo ""
        echo "📋 Coverage by Category:"
        echo ""

        # Use node to parse JSON and extract coverage
        node -e "
            const fs = require('fs');
            const data = JSON.parse(fs.readFileSync('coverage/coverage-summary.json', 'utf8'));

            const total = data.total;
            console.log('Overall Coverage:');
            console.log('  Lines:      ' + total.lines.pct.toFixed(2) + '%');
            console.log('  Statements: ' + total.statements.pct.toFixed(2) + '%');
            console.log('  Functions:  ' + total.functions.pct.toFixed(2) + '%');
            console.log('  Branches:   ' + total.branches.pct.toFixed(2) + '%');
            console.log('');

            // Check if meets threshold
            const threshold = 70;
            const meetsThreshold =
                total.lines.pct >= threshold &&
                total.statements.pct >= threshold &&
                total.functions.pct >= threshold &&
                total.branches.pct >= threshold;

            if (meetsThreshold) {
                console.log('✅ Coverage meets 70% threshold!');
            } else {
                console.log('⚠️  Coverage below 70% threshold');
                console.log('   Target: 70% for all metrics');
            }
        "
    fi
else
    echo -e "${YELLOW}⚠️  Coverage data not generated${NC}"
fi

# Count test files and tests
echo ""
echo "📝 Test Statistics:"
echo "==================="

if [ -f "test-output.log" ]; then
    # Extract test counts
    TEST_FILES=$(grep -o "[0-9]* passed" test-output.log | head -1 | grep -o "[0-9]*" || echo "0")
    TESTS=$(grep -o "Tests.*passed" test-output.log | grep -o "[0-9]*" | head -1 || echo "0")

    echo "  Test Files: $TEST_FILES"
    echo "  Tests:      $TESTS"
fi

# List test files
echo ""
echo "📁 Test Files:"
echo "=============="
find tests -name "*.test.ts" -type f | sort | while read -r file; do
    echo "  - $file"
done

# Summary
echo ""
echo "🎯 Next Steps:"
echo "==============="
echo "  1. Review coverage report: coverage/lcov-report/index.html"
echo "  2. Check uncovered lines in the report"
echo "  3. Add tests for uncovered code paths"
echo "  4. Run 'npm test -- --coverage' to verify improvements"
echo ""

# Clean up
rm -f test-output.log

echo "✨ Done!"
