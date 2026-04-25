#!/bin/bash
echo "Running pre-push checks..."
ERRORS=0

# Check 1: landing.module.css
if grep -q "landing.module.css" app/page.jsx 2>/dev/null; then
  echo "🔧 Fixing landing.module.css..."
  sed -i '' '/landing.module.css/d' app/page.jsx 2>/dev/null || sed -i '/landing.module.css/d' app/page.jsx
  echo "✓ Fixed"
fi

# Check 2: NAV_FULL in layout
if ! grep -q "const NAV_FULL" app/dashboard/layout.jsx 2>/dev/null; then
  echo "❌ NAV_FULL missing from layout.jsx!"
  ERRORS=$((ERRORS+1))
else
  echo "✓ NAV_FULL present"
fi

# Check 3: bcrypt vs bcryptjs
if grep -rq "from 'bcrypt'" app/api/ 2>/dev/null; then
  echo "🔧 Fixing bcrypt -> bcryptjs..."
  find app/api -name "*.js" -exec sed -i '' "s/from 'bcrypt'/from 'bcryptjs'/g" {} \; 2>/dev/null || \
  find app/api -name "*.js" -exec sed -i "s/from 'bcrypt'/from 'bcryptjs'/g" {} \;
  echo "✓ Fixed"
fi

# Check 4: messages inserts missing tenant_id (multiline aware)
MISSING=$(python3 -c "
import re, sys
content = open('app/api/chat/route.js').read()
inserts = re.findall(r\"supabaseAdmin\.from\('messages'\)\.insert\(\{.+?\}\)\", content, re.DOTALL)
missing = [i for i in inserts if 'tenant_id' not in i]
print(len(missing))
" 2>/dev/null)
if [ "$MISSING" != "0" ] && [ -n "$MISSING" ]; then
  echo "❌ $MISSING messages insert(s) missing tenant_id"
  ERRORS=$((ERRORS+1))
else
  echo "✓ All messages inserts have tenant_id"
fi

# Check 5: widget.js syntax
if node --check public/widget.js 2>/dev/null; then
  echo "✓ widget.js syntax OK"
else
  echo "❌ widget.js has syntax errors!"
  ERRORS=$((ERRORS+1))
fi

# Check 6: duplicate handoffRx
COUNT=$(grep -c "const handoffRx" app/api/chat/route.js 2>/dev/null || echo 0)
if [ "$COUNT" -gt "1" ]; then
  echo "❌ Duplicate handoffRx ($COUNT found)"
  ERRORS=$((ERRORS+1))
else
  echo "✓ handoffRx OK"
fi

if [ $ERRORS -gt 0 ]; then
  echo "❌ $ERRORS issue(s) need fixing"
  exit 1
else
  echo "✓ All checks passed — safe to push"
fi
