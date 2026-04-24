#!/bin/bash
echo "Running pre-push checks..."

ERRORS=0

# Check 1: landing.module.css
if grep -q "landing.module.css" app/page.jsx 2>/dev/null; then
  echo "❌ landing.module.css found - removing..."
  sed -i '' '/landing.module.css/d' app/page.jsx
  echo "✓ Fixed"
fi

# Check 2: NAV_FULL in layout
if ! grep -q "const NAV_FULL" app/dashboard/layout.jsx 2>/dev/null; then
  echo "❌ NAV_FULL missing from layout.jsx!"
  ERRORS=$((ERRORS+1))
else
  echo "✓ NAV_FULL present in layout.jsx"
fi

# Check 3: bcrypt vs bcryptjs
if grep -rq "from 'bcrypt'" app/api/ 2>/dev/null; then
  echo "⚠️  Found 'bcrypt' - replacing with 'bcryptjs'..."
  find app/api -name "*.js" -exec sed -i '' "s/from 'bcrypt'/from 'bcryptjs'/g" {} \;
  echo "✓ Fixed"
fi

# Check 4: stray quote - only catch number:number' pattern like gap:6'
if grep -rn ":[0-9]\+'" app/ --include="*.jsx" --include="*.js" 2>/dev/null | grep -v "gap:'" | grep -v "node_modules" | grep -q "'; }}"; then
  echo "⚠️  Possible stray quote in JSX style"
  ERRORS=$((ERRORS+1))
fi

if [ $ERRORS -gt 0 ]; then
  echo "❌ $ERRORS issue(s) need fixing before push"
  exit 1
else
  echo "✓ All checks passed — safe to push"
fi
