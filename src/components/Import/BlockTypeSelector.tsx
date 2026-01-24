import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import './Import.css';

interface BlockTypeSelectorProps {
    value: string;
    onChange: (type: string) => void;
    suggestedType?: string;
}

const BLOCK_TYPES = [
    { value: 'Role', label: 'Role', icon: '👤' },
    { value: 'Task', label: 'Task', icon: '🎯' },
    { value: 'Context', label: 'Context', icon: '📋' },
    { value: 'Output', label: 'Output', icon: '📤' },
    { value: 'Style', label: 'Style', icon: '🎨' },
    { value: 'Constraints', label: 'Constraints', icon: '⚠️' },
];

export const BlockTypeSelector: React.FC<BlockTypeSelectorProps> = ({
    value,
    onChange,
    suggestedType,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const selectedType = BLOCK_TYPES.find((t) => t.value === value);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const handleSelect = (type: string) => {
        onChange(type);
        setIsOpen(false);
    };

    return (
        <div className="block-type-selector" ref={dropdownRef}>
            <button
                className="block-type-selector-button"
                onClick={() => setIsOpen(!isOpen)}
                type="button"
            >
                <span>
                    {selectedType?.icon} {selectedType?.label}
                </span>
                <ChevronDown size={16} />
            </button>

            {isOpen && (
                <div className="block-type-selector-dropdown">
                    {BLOCK_TYPES.map((type) => (
                        <div
                            key={type.value}
                            className={`block-type-option ${value === type.value ? 'selected' : ''}`}
                            onClick={() => handleSelect(type.value)}
                        >
                            <span>{type.icon}</span>
                            <span className="block-type-option-label">{type.label}</span>
                            {suggestedType === type.value && (
                                <span style={{ fontSize: '0.75rem', color: 'var(--accent-success)' }}>
                                    Suggested
                                </span>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
