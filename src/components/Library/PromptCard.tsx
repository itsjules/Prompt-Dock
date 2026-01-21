import { Play, Copy, Star, FolderPlus, Trash2 } from 'lucide-react';
import type { Prompt } from '../../schemas/prompt.schema';
import { usePromptStore } from '../../stores/usePromptStore';
import './PromptCard.css';

interface PromptCardProps {
    prompt: Prompt;
    onUse: (prompt: Prompt) => void;
    onAddToCollection?: (prompt: Prompt) => void;
    onDelete?: (prompt: Prompt) => void;
}

export const PromptCard = ({ prompt, onUse, onAddToCollection, onDelete }: PromptCardProps) => {
    const { toggleFavorite } = usePromptStore();

    const handleCopy = (e: React.MouseEvent) => {
        e.stopPropagation();
        // Simple copy for now
        navigator.clipboard.writeText(prompt.title);
    };

    const handleToggleFavorite = (e: React.MouseEvent) => {
        e.stopPropagation();
        toggleFavorite(prompt.id);
    };

    return (
        <div className="prompt-card" onClick={() => onUse(prompt)}>
            <div className="prompt-card-header">
                <h3 className="prompt-title">{prompt.title}</h3>
                <button
                    className={`favorite-btn ${prompt.isFavorite ? 'active' : ''}`}
                    onClick={handleToggleFavorite}
                    title={prompt.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                >
                    <Star size={16} fill={prompt.isFavorite ? 'currentColor' : 'none'} />
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
                {onAddToCollection && (
                    <button className="action-btn" onClick={(e) => { e.stopPropagation(); onAddToCollection(prompt); }} title="Add to Collection">
                        <FolderPlus size={16} />
                    </button>
                )}
                {onDelete && (
                    <button className="action-btn danger" onClick={(e) => { e.stopPropagation(); onDelete(prompt); }} title="Delete Prompt">
                        <Trash2 size={16} />
                    </button>
                )}
                <button className="action-btn primary" onClick={() => onUse(prompt)} title="Use this prompt">
                    <Play size={16} /> Use
                </button>
            </div>
        </div>
    );
};
