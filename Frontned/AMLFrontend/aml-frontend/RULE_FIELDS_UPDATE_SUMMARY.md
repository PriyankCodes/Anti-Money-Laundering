# AML Rule Fields Update Summary

## ✅ All Rule Configurations Updated to Match Reference Document

**Date:** November 6, 2025  
**File Updated:** `src/app/features/admin/rules/rules.ts`  
**Reference:** `AML_RULE_CONDITIONS_REFERENCE.md`

---

## 📋 Changes Made

### 1. **THRESHOLD Rule** ✅
**Description Updated:** "Detects transactions based on amount thresholds and account behavior patterns"

**Fields (8 total):**
- ✅ `amountThreshold` - Simple threshold amount (placeholder: 100000)
- ✅ `minAmount` - Minimum amount for range-based rules (placeholder: 9000)
- ✅ `maxAmount` - Maximum amount for range-based rules (placeholder: 10000)
- ✅ `currency` - Currency code (defaults to "ANY")
- ✅ `transactionType` - Filter by transaction type (added WITHDRAWAL option)
- ✅ `amountToBalanceRatio` - Trigger if amount exceeds % of balance (0.8)
- ✅ `historicalDays` - Days to look back for average calculation (30)
- ✅ `deviationFactor` - Multiplier for historical average (3.0)

**Key Changes:**
- Updated minAmount/maxAmount placeholders to 9000/10000 (structuring detection example)
- Simplified all field descriptions
- Added WITHDRAWAL to transaction type options
- Updated deviationFactor placeholder to 3.0

---

### 2. **FREQUENCY Rule** ✅
**Description Updated:** "Detects rapid succession of transactions within a time window"

**Fields (4 total):**
- ✅ `maxTransactions` - Maximum allowed transactions in window (required, placeholder: 5)
- ✅ `timeWindowMinutes` - Time window in minutes (required, placeholder: 30)
- ✅ `dormantDays` - Days of inactivity before flagging (optional, placeholder: 90)
- ✅ `minAmount` - Minimum amount for dormant account check (optional, placeholder: 50000)

**Key Changes:**
- Updated timeWindowMinutes placeholder from 60 to 30
- Simplified field descriptions to match reference
- Removed "(for dormant check)" from minAmount label

---

### 3. **VELOCITY Rule** ✅
**Description Updated:** "Detects rapid movement of funds with specific patterns"

**Fields (4 total - REORDERED):**
- ✅ `timeWindowMinutes` - Time window for velocity check (required, placeholder: 1440)
- ✅ `minAmount` - Minimum transaction amount to consider (required, placeholder: 10000)
- ✅ `maxTransactions` - Maximum allowed transactions (required, placeholder: 5)
- ✅ `checkAlternation` - Check for alternating credit/debit pattern (optional)

**Key Changes:**
- **REORDERED fields** to match reference: timeWindowMinutes → minAmount → maxTransactions → checkAlternation
- Updated timeWindowMinutes placeholder from 120 to 1440 (24 hours)
- Updated maxTransactions placeholder from 3 to 5
- Simplified all field descriptions

---

### 4. **FUNNEL_ACCOUNT Rule** ✅
**Description Updated:** "Detects funnel accounts (many senders to one receiver - fan-in pattern)"

**Fields (2 total):**
- ✅ `minSenders` - Minimum unique senders to trigger (required, placeholder: 5)
- ✅ `timeWindowMinutes` - Time window for counting senders (required, placeholder: 60)

**Key Changes:**
- Simplified field descriptions to match reference exactly

---

### 5. **GEOGRAPHIC Rule** ✅
**Description Updated:** "Detects transactions involving high-risk countries based on sender/receiver location"

**Fields (2 total):**
- ✅ `highRiskAmountThreshold` - Amount threshold for HIGH risk countries (default: 50000)
- ✅ `mediumRiskAmountThreshold` - Amount threshold for MEDIUM risk countries (default: 500000)

**Key Changes:**
- Added default values to field descriptions
- Updated main description to mention sender/receiver location

---

### 6. **KEYWORD Rule** ✅
**Description Updated:** "Detects suspicious keywords in transaction descriptions using database-stored keywords"

**Fields:** None (database-driven)

**Key Changes:**
- Enhanced description to clarify database-driven nature

---

### 7. **PATTERN Rule** ✅
**Description Updated:** "Detects specific patterns using regex matching on transaction fields"

**Fields (2 total):**
- ✅ `regex` - Regular expression pattern (required, placeholder: `.*round.*trip.*`)
- ✅ `field` - Field to match (defaults to "description") (optional)

**Key Changes:**
- Updated regex placeholder from `(?i)bribe|illegal|smurf` to `.*round.*trip.*` (matches reference)
- Simplified field descriptions

---

## 🔧 Validation Updates

### Transaction Type Validation
Added `WITHDRAWAL` to valid transaction types:
```typescript
const validTypes = ['DEBIT', 'CREDIT', 'TRANSFER', 'DEPOSIT', 'WITHDRAWAL'];
```

---

## 📊 Summary Statistics

| Metric | Count |
|--------|-------|
| **Total Rule Types** | 7 |
| **Total Fields** | 22 |
| **Required Fields** | 9 |
| **Optional Fields** | 13 |
| **Fields Updated** | 22 |
| **Descriptions Updated** | 29 |
| **Placeholders Updated** | 8 |

---

## ✅ Verification Checklist

- ✅ All field names match backend exactly
- ✅ All field types match reference (number, text, select)
- ✅ All required/optional flags match reference
- ✅ All placeholders match reference examples
- ✅ All descriptions match reference
- ✅ Field order matches reference (especially VELOCITY)
- ✅ All select options match reference
- ✅ Validation logic includes all valid values
- ✅ WITHDRAWAL added to transaction types
- ✅ All 7 rule types configured correctly

---

## 🎯 Key Improvements

1. **Consistency:** All fields now match the backend reference document exactly
2. **Clarity:** Simplified descriptions for better user understanding
3. **Examples:** Placeholders now show realistic values from reference
4. **Completeness:** All fields from backend are now available in frontend
5. **Validation:** Transaction type validation includes WITHDRAWAL

---

## 📝 Field Mapping Reference

### THRESHOLD Rule
```json
{
  "amountThreshold": 100000,
  "minAmount": 9000,
  "maxAmount": 10000,
  "currency": "INR",
  "transactionType": "TRANSFER",
  "amountToBalanceRatio": 0.8,
  "historicalDays": 30,
  "deviationFactor": 3.0
}
```

### FREQUENCY Rule
```json
{
  "maxTransactions": 5,
  "timeWindowMinutes": 30,
  "dormantDays": 90,
  "minAmount": 50000
}
```

### VELOCITY Rule
```json
{
  "timeWindowMinutes": 1440,
  "minAmount": 10000,
  "maxTransactions": 5,
  "checkAlternation": true
}
```

### FUNNEL_ACCOUNT Rule
```json
{
  "minSenders": 5,
  "timeWindowMinutes": 60
}
```

### GEOGRAPHIC Rule
```json
{
  "highRiskAmountThreshold": 50000,
  "mediumRiskAmountThreshold": 500000
}
```

### KEYWORD Rule
```json
{}
```

### PATTERN Rule
```json
{
  "regex": ".*round.*trip.*",
  "field": "description"
}
```

---

## 🚀 Testing Recommendations

1. **Test Each Rule Type:**
   - Create a new rule for each type
   - Verify all fields appear correctly
   - Check placeholders and descriptions
   - Validate required field enforcement

2. **Test Field Order:**
   - Especially verify VELOCITY field order (timeWindowMinutes first)
   - Ensure all fields render in correct sequence

3. **Test Validation:**
   - Try invalid values
   - Test required field validation
   - Verify WITHDRAWAL transaction type works

4. **Test Edit Mode:**
   - Edit existing rules
   - Verify fields populate correctly from JSON
   - Check that all fields are editable

---

## ✨ Result

All rule fields are now **100% aligned** with the backend reference document. The admin interface will display the correct fields for each rule type with accurate descriptions, placeholders, and validation! 🎉
