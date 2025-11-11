package com.tss.aml.service;

import com.tss.aml.entity.Transaction;
import com.tss.aml.rule.RuleEngineResult;

public interface RuleEngineService {
    RuleEngineResult evaluate(Transaction transaction);
}