package com.tss.aml.service.impl;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.tss.aml.entity.Rule;
import com.tss.aml.entity.Transaction;
import com.tss.aml.repository.RuleRepository;
import com.tss.aml.rule.RuleEngineResult;
import com.tss.aml.rule.RuleEvaluator;
import com.tss.aml.service.RuleEngineService;

@Service
@Transactional
public class RuleEngineServiceImpl implements RuleEngineService {

    private static final Logger logger = LoggerFactory.getLogger(RuleEngineServiceImpl.class);

    private static final int BLOCK_THRESHOLD = 90;
    private static final int FLAG_THRESHOLD = 60;

    // Tunable: larger = more conservative (needs more/stronger rules to reach same p)
    private static final double DECAY_SCALE = 100.0;

    private final RuleRepository ruleRepository;
    private final List<RuleEvaluator> evaluators;

    @Autowired
    public RuleEngineServiceImpl(RuleRepository ruleRepository, List<RuleEvaluator> evaluators) {
        this.ruleRepository = ruleRepository;
        this.evaluators = evaluators;
    }

    @Override
    public RuleEngineResult evaluate(Transaction transaction) {
        logger.info("=== AML RULE EVALUATION START ===");
        logger.info("Transaction ID: {}, Amount: {} {}, Type: {}, Customer: {}",
                transaction.getTransactionId(),
                transaction.getAmount(),
                transaction.getCurrency(),
                transaction.getTransactionType(),
                transaction.getCustomer() != null ? transaction.getCustomer().getUserId() : "Unknown");

        List<Rule> activeRules = ruleRepository.findByIsActiveTrue();
        logger.info("Found {} active rules to evaluate", activeRules.size());

        List<String> triggeredRules = new ArrayList<>();
        List<String> triggeredRuleTypes = new ArrayList<>();

        // We'll compute combined probability: combined = 1 - product(1 - p_i)
        double productOfNotP = 1.0;

        for (Rule rule : activeRules) {
            try {
                Optional<RuleEvaluator> evaluatorOpt = evaluators.stream()
                        .filter(ev -> ev.supports(rule.getType().name()))
                        .findFirst();

                if (evaluatorOpt.isEmpty()) {
                    logger.warn("Skipping rule '{}' (type {}) – no evaluator found", rule.getName(), rule.getType());
                    continue;
                }

                RuleEvaluator evaluator = evaluatorOpt.get();
                boolean triggered = evaluator.evaluate(transaction, rule);

                if (triggered) {
                    int riskImpact = evaluator.getRiskScoreImpact(transaction, rule);

                    triggeredRules.add(rule.getName());
                    triggeredRuleTypes.add(rule.getType().name());

                    // Convert absolute impact (1-100) into probability-like p in (0,1)
                    // using exponential transform: p = 1 - exp(-impact / DECAY_SCALE)
                    double p = 1.0 - Math.exp(-riskImpact / DECAY_SCALE);

                    // Update product of (1 - p_i)
                    productOfNotP *= (1.0 - p);

                    logger.warn("🚨 RULE TRIGGERED: {} | Risk Impact: {} | p: {} | Interm Product(1-p): {}",
                            rule.getName(), riskImpact, String.format("%.4f", p), String.format("%.6f", productOfNotP));

                } else {
                    logger.debug("✅ Rule passed: {}", rule.getName());
                }

            } catch (Exception e) {
                logger.error("❌ Error evaluating rule {}: {}", rule.getName(), e.getMessage(), e);
            }
        }

        // Combined probability → final base score (0..100)
        double combinedProb = 1.0 - productOfNotP;
        double combinedScore = combinedProb * 100.0;
        int ruleScore = (int) Math.round(Math.min(100.0, combinedScore));

        logger.info("Combined probability: {} => Combined score: {}", String.format("%.4f", combinedProb),
                String.format("%.2f", combinedScore));

        int finalScore = ruleScore;

        // Determine action
        String action;
        boolean suspicious;
        if (finalScore >= BLOCK_THRESHOLD) {
            action = "BLOCK";
            suspicious = true;
        } else if (finalScore >= FLAG_THRESHOLD) {
            action = "FLAG";
            suspicious = true;
        } else {
            action = "ALLOW";
            suspicious = false;
        }

        logger.info("=== EVALUATION SUMMARY ===");
        logger.info("Final Risk Score: {}/100", finalScore);
        logger.info("Triggered Rules: {}", triggeredRules);
        logger.info("Transaction Action: {}", action);
        logger.info("=== AML RULE EVALUATION END ===");

        return suspicious ? RuleEngineResult.suspicious(finalScore, triggeredRules, triggeredRuleTypes)
                : RuleEngineResult.clean(finalScore, triggeredRules, triggeredRuleTypes);
    }
}
