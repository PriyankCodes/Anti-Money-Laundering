package com.tss.aml.rule;

import com.tss.aml.entity.Rule;
import com.tss.aml.entity.Transaction;
import java.util.Optional;

public interface RuleEvaluator {

    boolean supports(String ruleType);
    boolean evaluate(Transaction transaction, Rule rule);

    /**
     * Default impact — used if no dynamic risk scaling needed.
     */
    default int getRiskScoreImpact(Rule rule) {
        return Optional.ofNullable(rule)
                .map(Rule::getRiskScoreImpact)
                .orElse(50);
    }

    /**
     * Dynamic version — evaluators can override this
     * if risk depends on the current transaction context.
     */
    default int getRiskScoreImpact(Transaction tx, Rule rule) {
        // by default, just delegate to the static version
        return getRiskScoreImpact(rule);
    }
}
