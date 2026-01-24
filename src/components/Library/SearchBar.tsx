import { Search } from 'lucide-react';
import { useUIStore } from '../../stores/useUIStore';
import './SearchBar.css';

export const SearchBar = () => {
    const { searchQuery, setSearchQuery } = useUIStore();

    return (
        <div className="search-bar-container">
            <Search className="search-icon" size={18} />
            <input
                type="text"
                className="search-input"
                placeholder="Search library..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                spellCheck={false}
            />
        </div>
    );
};
