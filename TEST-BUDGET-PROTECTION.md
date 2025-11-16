# 🧪 BUDGET PROTECTION - VERIFICATION TESTS

## Test Suite: Verify $200/month Hard Limit

### Test 1: Verify Budget Configuration
```bash
# Check that max tokens is 1024 (not 4096)
grep "AGENT_MAX_TOKENS" apps/synqra-mvp/.env.example
# Expected: AGENT_MAX_TOKENS=1024

# Check budget limits in code
grep "monthlyBudget:" apps/synqra-mvp/lib/agents/budgetGuardrails.ts
# Expected: monthlyBudget: 200
```

### Test 2: Query Budget Status API
```bash
# Start server
cd apps/synqra-mvp && npm run dev

# In another terminal
curl http://localhost:3004/api/budget/status | jq

# Expected output:
# {
#   "status": "healthy",
#   "budget": {
#     "monthly": {
#       "limit": 200,
#       "used": 0,
#       "remaining": 200,
#       "percentage": 0
#     }
#   },
#   "locked": false
# }
```

### Test 3: Verify Request Blocking (Mock)
```bash
# Create test script
cat > test-budget-block.mjs << 'SCRIPT'
import { checkBudget, recordCost } from './apps/synqra-mvp/lib/agents/budgetGuardrails.ts';

// Simulate $195 spent (should block next request)
for (let i = 0; i < 100; i++) {
  recordCost(1.95);
}

// Try to make request
const check = checkBudget(0.10);
console.log('Budget check:', check);
// Expected: { allowed: false, reason: "Monthly budget exceeded" }
SCRIPT

node test-budget-block.mjs
```

### Test 4: Verify Alert Thresholds
```bash
# Test warning alert (70%)
# Simulate $141 spent
curl -X POST http://localhost:3004/api/test/simulate-cost \
  -H "Content-Type: application/json" \
  -d '{"amount": 141}'

# Check Telegram for warning message
# Expected: "📊 BUDGET ALERT: WARNING"
```

### Test 5: Verify Emergency Lock
```bash
# Simulate $191 spent (over 95% threshold)
curl -X POST http://localhost:3004/api/test/simulate-cost \
  -H "Content-Type: application/json" \
  -d '{"amount": 191}'

# Try to make agent request
curl -X POST http://localhost:3004/api/agents \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello"}'

# Expected: Error response about budget exceeded
```

### Test 6: Verify Per-Request Maximum
```bash
# Try to make expensive request
# Simulate a request that would cost $0.10 (over $0.05 limit)

# Expected: Blocked before API call
```

### Test 7: Check Cost Calculation Accuracy
```bash
# Compare estimated vs actual costs
# Make 10 test requests, verify costs are ~$0.01-0.02 each
```

## ✅ PASS CRITERIA

All tests must pass:
- [ ] Max tokens is 1024
- [ ] Monthly budget is $200
- [ ] Budget status API works
- [ ] Requests blocked at 95%
- [ ] Alerts sent at 70%, 85%, 95%
- [ ] Per-request limit enforced
- [ ] Costs match projections ($0.01-0.02/request)

## 🚨 FAILURE SCENARIOS

If any test fails:
1. Check code changes
2. Verify .env configuration
3. Review guardrail logic
4. Test in mock mode first
5. DO NOT deploy to production

---

**Run these tests BEFORE deploying to production!**
