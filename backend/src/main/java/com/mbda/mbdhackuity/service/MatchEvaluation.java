package com.mbda.mbdhackuity.service;

public class MatchEvaluation {
    private final boolean matched;
    private final double confidence;
    private final String matchType;

    public MatchEvaluation(boolean matched, double confidence, String matchType) {
        this.matched = matched;
        this.confidence = confidence;
        this.matchType = matchType;
    }

    public boolean isMatched() { return matched; }
    public double getConfidence() { return confidence; }
    public String getMatchType() { return matchType; }
}