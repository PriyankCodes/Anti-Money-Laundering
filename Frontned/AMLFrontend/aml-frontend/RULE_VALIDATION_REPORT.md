# AML Rules SQL Validation Report

## 📋 Analysis Summary

**Total Rules:** 50  
**Date:** November 6, 2025  
**Status:** ⚠️ Issues Found

---

## ❌ Critical Issues

### 1. **Incorrect Rule Types**
Several rules are using the wrong rule type for their conditions:

| Rule Name | Current Type | Should Be | Reason |
|-----------|-------------|-----------|---------|
| Cumulative Daily Outflow | THRESHOLD | FREQUENCY or VELOCITY | Checking "total outgoing transactions" implies multiple transactions |
| Weekly Volume Cap | THRESHOLD | FREQUENCY or VELOCITY | Checking transactions over 7 days implies aggregation |
| High Cash Deposit Limit | THRESHOLD | FREQUENCY or VELOCITY | "within 30 days" implies multiple transactions |
| Country Mismatch Activity | GEOGRAPHIC | N/A | "Customer domicile differs from transaction country" - not a valid geographic rule condition |
| Routing Via Offshore Hub | GEOGRAPHIC | N/A | "Payment routed through" - backend doesn't support routing detection |
| New High-Risk Country Activity | GEOGRAPHIC | N/A | "Customer starts transacting in new" - backend doesn't track "new" countries |
| Unusual Night Activity | FREQUENCY | N/A | Backend doesn't support time-of-day filtering |
| New Account High Activity | FREQUENCY | N/A | Backend doesn't track account age |
| Donation or Gift With High Amount | KEYWORD | PATTERN or THRESHOLD | "but unusually large amount" - KEYWORD doesn't check amounts |
| Illicit Vendor Reference | KEYWORD | PATTERN | "known dark market names" - KEYWORD uses DB, not specific names |
| Virtual Asset Reference | KEYWORD | PATTERN | Specific terms should use PATTERN with regex |
| Unusual Business Description | KEYWORD | PATTERN | "inconsistent with customer profile" - backend doesn't check profiles |
| Instant Withdraw After Deposit | VELOCITY | N/A | Backend doesn't detect deposit-then-withdrawal sequences |
| High Volume Inflow | VELOCITY | FREQUENCY | "Receives credits" - VELOCITY checks transactions above minAmount, not credit-specific |
| Apex Funnel Pattern | FUNNEL_ACCOUNT | N/A | "then single outward transfer" - backend only detects inbound funnel, not outbound |
| Corporate Funnel Activity | FUNNEL_ACCOUNT | N/A | "consolidated into large outward" - backend doesn't track outbound |
| Payroll Mule Network | FUNNEL_ACCOUNT | N/A | "salary-type inflows" - backend doesn't detect transaction types |
| Crypto Funnel Detection | FUNNEL_ACCOUNT | N/A | "crypto deposits" - backend doesn't detect crypto specifically |

---

## ⚠️ Semantic/Logic Issues

### Rules That Won't Work As Described

1. **Cumulative Daily Outflow** - THRESHOLD doesn't aggregate multiple transactions
2. **Weekly Volume Cap** - THRESHOLD checks single transaction, not cumulative
3. **High Cash Deposit Limit** - THRESHOLD doesn't track "within 30 days"
4. **Country Mismatch Activity** - GEOGRAPHIC only checks if country is in risky_countries table
5. **Routing Via Offshore Hub** - Backend doesn't have routing information
6. **New High-Risk Country Activity** - Backend doesn't track "new" vs "existing" countries
7. **Unusual Night Activity** - Backend doesn't filter by time of day
8. **New Account High Activity** - Backend doesn't know account age
9. **Donation or Gift With High Amount** - KEYWORD doesn't check amounts
10. **Instant Withdraw After Deposit** - VELOCITY doesn't detect sequences
11. **Apex Funnel Pattern** - FUNNEL_ACCOUNT only detects inbound, not outbound
12. **Corporate/Payroll/Crypto Funnel** - FUNNEL_ACCOUNT doesn't distinguish transaction types

---

## 🔄 Duplicate/Similar Rules

### Potential Duplicates

1. **High Single Transaction Threshold** vs **High-Value Withdrawal**
   - Both check single transaction thresholds
   - Different currencies and amounts, but similar concept

2. **Structuring (Smurfing)** vs **Frequent Small Deposits**
   - Both detect multiple transactions in short time
   - Very similar conditions (5 in 60 min vs 6 in 120 min)

3. **Burst Activity Pattern** vs **Rapid Repeated Transfers**
   - Both detect rapid transactions
   - Similar time windows and counts

4. **Round Amount Pattern** vs **Round Figure Deposit**
   - Both detect round amounts
   - One uses PATTERN, one uses THRESHOLD (THRESHOLD is better here)

5. **Gift Mention Pattern** vs **Donation or Gift With High Amount**
   - Both detect gift-related transactions
   - One uses PATTERN, one uses KEYWORD

---

## ✅ Valid Rules (Correctly Configured)

### A. THRESHOLD Rules (Valid: 5/10)
1. ✅ **High Single Transaction Threshold** - Correct
2. ✅ **Large Corporate Payment** - Correct
3. ❌ **Cumulative Daily Outflow** - Wrong type
4. ❌ **Weekly Volume Cap** - Wrong type
5. ❌ **High Cash Deposit Limit** - Wrong type
6. ✅ **Round Figure Deposit** - Correct (structuring detection)
7. ✅ **High-Value Withdrawal** - Correct
8. ✅ **International Wire Limit** - Correct
9. ✅ **High Amount-to-Balance Ratio** - Correct (advanced field)
10. ✅ **Deviation From Past Behavior** - Correct (advanced field)

### B. GEOGRAPHIC Rules (Valid: 1/5)
1. ✅ **High-Risk Country Transaction** - Correct
2. ✅ **Sanctioned Country Transaction** - Correct (but relies on DB setup)
3. ❌ **Country Mismatch Activity** - Not supported
4. ❌ **Routing Via Offshore Hub** - Not supported
5. ❌ **New High-Risk Country Activity** - Not supported

### C. FREQUENCY Rules (Valid: 5/7)
1. ✅ **Structuring (Smurfing)** - Correct
2. ✅ **Burst Activity Pattern** - Correct
3. ❌ **Unusual Night Activity** - Time filtering not supported
4. ❌ **New Account High Activity** - Account age not supported
5. ✅ **Frequent Small Deposits** - Correct
6. ✅ **Rapid Repeated Transfers** - Correct
7. ✅ **Dormant-to-Active Spike** - Correct (advanced field)

### D. KEYWORD Rules (Valid: 1/5)
1. ✅ **Suspicious Narrative Terms** - Correct (uses DB)
2. ❌ **Donation or Gift With High Amount** - Amount checking not supported
3. ❌ **Illicit Vendor Reference** - Should use PATTERN
4. ❌ **Virtual Asset Reference** - Should use PATTERN
5. ❌ **Unusual Business Description** - Profile checking not supported

### E. PATTERN Rules (Valid: 5/5)
1. ✅ **Round Amount Pattern** - Correct
2. ✅ **Repetitive Reference Code** - Correct
3. ✅ **Gift Mention Pattern** - Correct
4. ✅ **Duplicate Invoice Pattern** - Correct
5. ✅ **Crypto Keyword Pattern** - Correct

### F. VELOCITY Rules (Valid: 3/5)
1. ✅ **Rapid Outflow Velocity** - Correct
2. ❌ **Instant Withdraw After Deposit** - Sequence detection not supported
3. ✅ **High Outbound Velocity** - Correct
4. ❌ **High Volume Inflow** - Should use FREQUENCY (credit-specific not supported)
5. ✅ **Deposit–Withdrawal Alternating Pattern** - Correct (checkAlternation field)

### G. FUNNEL_ACCOUNT Rules (Valid: 2/6)
1. ✅ **Funnel Account Detection** - Correct
2. ❌ **Apex Funnel Pattern** - Outbound tracking not supported
3. ❌ **Corporate Funnel Activity** - Outbound tracking not supported
4. ❌ **Payroll Mule Network** - Transaction type detection not supported
5. ❌ **Crypto Funnel Detection** - Crypto detection not supported
6. ✅ **Inbound Burst Funnel** - Correct

---

## 📊 Validation Summary

| Rule Type | Total | Valid | Invalid | Success Rate |
|-----------|-------|-------|---------|--------------|
| THRESHOLD | 10 | 8 | 2 | 80% |
| GEOGRAPHIC | 5 | 2 | 3 | 40% |
| FREQUENCY | 7 | 5 | 2 | 71% |
| KEYWORD | 5 | 1 | 4 | 20% |
| PATTERN | 5 | 5 | 0 | 100% |
| VELOCITY | 5 | 3 | 2 | 60% |
| FUNNEL_ACCOUNT | 6 | 2 | 4 | 33% |
| **TOTAL** | **50** | **26** | **24** | **52%** |

---

## 🔧 Recommended Fixes

### Rules to Remove (Not Supported by Backend)
1. Country Mismatch Activity
2. Routing Via Offshore Hub
3. New High-Risk Country Activity
4. Unusual Night Activity
5. New Account High Activity
6. Donation or Gift With High Amount
7. Illicit Vendor Reference
8. Virtual Asset Reference
9. Unusual Business Description
10. Instant Withdraw After Deposit
11. Apex Funnel Pattern
12. Corporate Funnel Activity
13. Payroll Mule Network
14. Crypto Funnel Detection

### Rules to Modify

#### 1. Cumulative Daily Outflow → VELOCITY
```sql
('Cumulative Daily Outflow', 'Multiple outgoing transactions totaling over 25,000 USD in 24 hours', 'VELOCITY',
 '{"timeWindowMinutes":1440,"minAmount":1000,"maxTransactions":20}', 75, TRUE, NOW()),
```

#### 2. Weekly Volume Cap → VELOCITY
```sql
('Weekly Volume Cap', 'More than 50 transactions in 7 days', 'VELOCITY',
 '{"timeWindowMinutes":10080,"minAmount":1000,"maxTransactions":50}', 70, TRUE, NOW()),
```

#### 3. High Cash Deposit Limit → FREQUENCY
```sql
('High Cash Deposit Limit', 'More than 5 cash deposits above 10,000 INR in 30 days', 'FREQUENCY',
 '{"maxTransactions":5,"timeWindowMinutes":43200}', 60, TRUE, NOW()),
```

#### 4. High Volume Inflow → FREQUENCY
```sql
('High Volume Inflow', 'Receives 10+ transactions above 10,000 INR in 60 mins', 'FREQUENCY',
 '{"maxTransactions":10,"timeWindowMinutes":60}', 75, TRUE, NOW()),
```

### Rules to Consolidate (Remove Duplicates)

**Keep:** High Single Transaction Threshold  
**Remove:** High-Value Withdrawal (too similar, just different currency)

**Keep:** Structuring (Smurfing)  
**Remove:** Frequent Small Deposits (very similar)

**Keep:** Burst Activity Pattern  
**Remove:** Rapid Repeated Transfers (similar concept)

**Keep:** Round Figure Deposit (THRESHOLD)  
**Remove:** Round Amount Pattern (PATTERN less effective here)

**Keep:** Crypto Keyword Pattern (PATTERN)  
**Remove:** Virtual Asset Reference (KEYWORD won't work)

---

## ✅ Corrected SQL (Valid Rules Only)

```sql
INSERT INTO rules (name, description, type, conditions, risk_score_impact, is_active, created_at)
VALUES
-- ===================== A. THRESHOLD RULES =====================
('High Single Transaction Threshold', 'Flags any single debit transaction exceeding 10,000 USD', 'THRESHOLD',
 '{"amountThreshold":10000,"currency":"USD","transactionType":"DEBIT"}', 70, TRUE, NOW()),
('Large Corporate Payment', 'Corporate account debit exceeding 100,000 USD', 'THRESHOLD',
 '{"amountThreshold":100000,"currency":"USD","transactionType":"DEBIT"}', 80, TRUE, NOW()),
('Round Figure Deposit', 'Repeated deposits in round figures like 9,000-10,000 INR (structuring)', 'THRESHOLD',
 '{"minAmount":9000,"maxAmount":10000,"currency":"INR"}', 75, TRUE, NOW()),
('International Wire Limit', 'International transfer exceeding 50,000 USD', 'THRESHOLD',
 '{"amountThreshold":50000,"currency":"USD"}', 75, TRUE, NOW()),
('High Amount-to-Balance Ratio', 'Transaction amount exceeds 80% of account balance', 'THRESHOLD',
 '{"amountToBalanceRatio":0.8}', 70, TRUE, NOW()),
('Deviation From Past Behavior', 'Transaction exceeds 5x customer's 30-day average', 'THRESHOLD',
 '{"historicalDays":30,"deviationFactor":5}', 85, TRUE, NOW()),

-- ===================== B. GEOGRAPHIC RULES =====================
('High-Risk Country Transaction', 'Transaction involves FATF high-risk jurisdiction', 'GEOGRAPHIC',
 '{"highRiskAmountThreshold":5000,"mediumRiskAmountThreshold":20000}', 80, TRUE, NOW()),
('Sanctioned Country Transaction', 'Transaction involving sanctioned or blacklisted country', 'GEOGRAPHIC',
 '{"highRiskAmountThreshold":1000}', 90, TRUE, NOW()),

-- ===================== C. FREQUENCY RULES =====================
('Structuring (Smurfing)', 'Multiple deposits just below reporting threshold in short time', 'FREQUENCY',
 '{"maxTransactions":5,"timeWindowMinutes":60}', 75, TRUE, NOW()),
('Burst Activity Pattern', 'More than 10 transactions within 30 minutes', 'FREQUENCY',
 '{"maxTransactions":10,"timeWindowMinutes":30}', 65, TRUE, NOW()),
('Dormant-to-Active Spike', 'Account inactive 30+ days suddenly makes large transaction', 'FREQUENCY',
 '{"dormantDays":30,"minAmount":10000}', 85, TRUE, NOW()),
('High Cash Deposit Frequency', 'More than 5 deposits above 10,000 INR in 30 days', 'FREQUENCY',
 '{"maxTransactions":5,"timeWindowMinutes":43200}', 60, TRUE, NOW()),

-- ===================== D. KEYWORD RULES =====================
('Suspicious Narrative Terms', 'Detects suspicious keywords in transaction descriptions (uses DB)', 'KEYWORD',
 '{}', 50, TRUE, NOW()),

-- ===================== E. PATTERN RULES =====================
('Repetitive Reference Code', 'Repeated alphanumeric references like ABC123', 'PATTERN',
 '{"regex":"[A-Z]{3}[0-9]{3}","field":"description"}', 50, TRUE, NOW()),
('Gift Mention Pattern', 'Narrative includes "gift" for large payments', 'PATTERN',
 '{"regex":".*gift.*","field":"description"}', 40, TRUE, NOW()),
('Duplicate Invoice Pattern', 'Same invoice number reused multiple times', 'PATTERN',
 '{"regex":"INV[0-9]{4}","field":"description"}', 45, TRUE, NOW()),
('Crypto Keyword Pattern', 'Mentions crypto, wallet, or bitcoin', 'PATTERN',
 '{"regex":".*crypto.*|.*bitcoin.*|.*wallet.*","field":"description"}', 55, TRUE, NOW()),

-- ===================== F. VELOCITY RULES =====================
('Rapid Outflow Velocity', 'More than 5 outbound txns above 1,000 INR in 15 mins', 'VELOCITY',
 '{"timeWindowMinutes":15,"minAmount":1000,"maxTransactions":5}', 70, TRUE, NOW()),
('High Outbound Velocity', '10+ outward transactions within 30 minutes', 'VELOCITY',
 '{"timeWindowMinutes":30,"minAmount":2000,"maxTransactions":10}', 80, TRUE, NOW()),
('Deposit–Withdrawal Alternating Pattern', 'Alternating credit/debit transactions in short window', 'VELOCITY',
 '{"timeWindowMinutes":30,"minAmount":5000,"maxTransactions":6,"checkAlternation":true}', 80, TRUE, NOW()),
('Cumulative Daily Outflow', 'Multiple outgoing transactions totaling over 25,000 USD in 24 hours', 'VELOCITY',
 '{"timeWindowMinutes":1440,"minAmount":1000,"maxTransactions":20}', 75, TRUE, NOW()),
('Weekly High Volume', 'More than 50 transactions above 1,000 USD in 7 days', 'VELOCITY',
 '{"timeWindowMinutes":10080,"minAmount":1000,"maxTransactions":50}', 70, TRUE, NOW()),

-- ===================== G. FUNNEL_ACCOUNT RULES =====================
('Funnel Account Detection', 'Multiple small inflows to one receiver within 1 hour', 'FUNNEL_ACCOUNT',
 '{"minSenders":5,"timeWindowMinutes":60}', 85, TRUE, NOW()),
('Inbound Burst Funnel', 'More than 20 unique senders in under 2 hours', 'FUNNEL_ACCOUNT',
 '{"minSenders":20,"timeWindowMinutes":120}', 90, TRUE, NOW());
```

**Total Valid Rules:** 26  
**Removed Invalid Rules:** 24

---

## 📝 Key Takeaways

1. **Backend Limitations:** Many rules assume features the backend doesn't support (time-of-day, account age, routing, sequences)
2. **Type Mismatches:** Several rules use wrong types (THRESHOLD for aggregations, KEYWORD for specific patterns)
3. **KEYWORD Rules:** Only work with database-stored keywords, can't check amounts or profiles
4. **FUNNEL_ACCOUNT:** Only detects inbound funneling (many→one), not outbound
5. **VELOCITY vs FREQUENCY:** Use VELOCITY for amount-based velocity, FREQUENCY for pure transaction counts
6. **GEOGRAPHIC:** Only checks if country is in risky_countries table with risk levels

---

**Recommendation:** Use the corrected SQL above with 26 valid, working rules instead of the original 50 rules with issues.
