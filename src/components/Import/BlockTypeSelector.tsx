import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { BlockType } from '../../schemas/block.schema';
import { BLOCK_COLORS, BLOCK_ACCENTS } from '../../constants/blockStyles';
import './Import.css';

interface BlockTypeSelectorProps {
    value: string;
    onChange: (type: string) => void;
    suggestedType?: string;
}

const BLOCK_TYPES: { value: BlockType; label: string }[] = [
    { value: 'Role', label: 'Role' },
    { value: 'Task', label: 'Task' },
    { value: 'Context', label: 'Context' },
    { value: 'Output', label: 'Output' },
    { value: 'Style', label: 'Style' },
    { value: 'Constraints', label: 'Constraints' },
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

    const getBlockColor = (type: string) => {
        return BLOCK_COLORS[type as BlockType] || '#2c2e33';
    };

    const getAccentColor = (type: string) => {
        return BLOCK_ACCENTS[type as BlockType] || '#9065B0';
    };

    return (
        <div className="block-type-selector" ref={dropdownRef}>
            <button
                className="block-type-selector-button"
                onClick={() => setIsOpen(!isOpen)}
                type="button"
                style={{
                    backgroundColor: getBlockColor(value),
                    borderColor: getAccentColor(value),
                    borderLeftWidth: '4px',
                }}
            >
                <span style={{ color: '#EAE0D5', fontWeight: 600 }}>
                    {selectedType?.label}
                </span>
                <ChevronDown size={16} color="#EAE0D5" />
            </button>

            {isOpen && (
                <div className="block-type-selector-dropdown">
                    {BLOCK_TYPES.map((type) => (
                        <div
                            key={type.value}
                            className={`block-type-option ${value === type.value ? 'selected' : ''}`}
                            onClick={() => handleSelect(type.value)}
                            style={{
                                backgroundColor: getBlockColor(type.value),
                                borderLeft: `4px solid ${getAccentColor(type.value)}`,
                                borderRight: 'none',
                                borderTop: 'none',
                                borderBottom: 'none', // Remove CSS border
                                borderRadius: '4px',
                                margin: '2px 0', // Vertical margin only
                                padding: '0.35rem 0.75rem', // Slightly thinner padding
                                fontSize: '0.8rem', // Smaller text
                            }}
                        >
                            <span className="block-type-option-label" style={{ color: '#EAE0D5' }}>{type.label}</span>
                            {suggestedType === type.value && (
                                <span style={{ fontSize: '0.65rem', color: '#8fce00', fontWeight: 'bold', backgroundColor: 'rgba(0,0,0,0.3)', padding: '1px 5px', borderRadius: '3px' }}>
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
