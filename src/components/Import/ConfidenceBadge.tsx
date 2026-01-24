import React from 'react';
import type { ConfidenceLevel } from '../../schemas/import.schema';
import './Import.css';

interface ConfidenceBadgeProps {
    level: ConfidenceLevel;
    score?: number;
}

const CONFIDENCE_LABELS: Record<ConfidenceLevel, string> = {
    high: 'High Confidence',
    medium: 'Review Suggested',
    low: 'Manual Review',
    manual: 'User Defined',
};

const CONFIDENCE_ICONS: Record<ConfidenceLevel, string> = {
    high: '✓',
    medium: '!',
    low: '?',
    manual: '✎',
};

export const ConfidenceBadge: React.FC<ConfidenceBadgeProps> = ({ level, score }) => {
    return (
        <span className={`confidence-badge confidence-badge-${level}`} title={score ? `Confidence: ${score}%` : undefined}>
            <span>{CONFIDENCE_ICONS[level]}</span>
            <span>{CONFIDENCE_LABELS[level]}</span>
        </span>
    );
};
