import { Play, Copy, Star } from 'lucide-react';
import type { Prompt } from '../../schemas/prompt.schema';
import './PromptCard.css';

interface PromptCardProps {
    prompt: Prompt;
    onUse: (prompt: Prompt) => void;
}

export const PromptCard = ({ prompt, onUse }: PromptCardProps) => {
    const handleCopy = (e: React.MouseEvent) => {
        e.stopPropagation();
        // Logic to build string from blocks would go here, 
        // for now just copy title/desc
        navigator.clipboard.writeText(prompt.title);
    };

    return (
        <div className="prompt-card" onClick={() => onUse(prompt)}>
            <div className="prompt-card-header">
                <h3 className="prompt-title">{prompt.title}</h3>
                <button className="favorite-btn" title="Favorite">
                    <Star size={16} />
                </button>
            </div>
            <p className="prompt-description">{prompt.description}</p>
            <div className="prompt-tags">
                {[
                    ...(prompt.tags?.style || []),
                    ...(prompt.tags?.topic || []),
                    ...(prompt.tags?.technique || [])
                ].map(tag => (
                    <span key={tag} className="tag">{tag}</span>
                ))}
            </div>
            <div className="prompt-actions">
                <button className="action-btn" onClick={handleCopy} title="Copy to Clipboard">
                    <Copy size={16} />
                </button>
                <button className="action-btn primary" onClick={() => onUse(prompt)} title="Use this prompt">
                    <Play size={16} /> Use
                </button>
            </div>
        </div>
    );
};
