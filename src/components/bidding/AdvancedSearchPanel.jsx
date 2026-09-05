import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, X, Save, Clock, DollarSign, Calendar, Briefcase, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '../ui/Button';

const AdvancedSearchPanel = ({ filters, onFilterChange, onSaveSearch, savedSearches, onApplySavedSearch }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [searchName, setSearchName] = useState('');
    const [showSaveInput, setShowSaveInput] = useState(false);

    const handleChange = (key, value) => {
        onFilterChange({ ...filters, [key]: value });
    };

    const handleSave = () => {
        if (searchName.trim()) {
            onSaveSearch(searchName);
            setSearchName('');
            setShowSaveInput(false);
        }
    };

    const complexityLevels = ['entry', 'intermediate', 'expert'];
    const durations = [
        { label: '< 1 week', value: '7' },
        { label: '1-4 weeks', value: '30' },
        { label: '1-3 months', value: '90' },
        { label: '> 3 months', value: '91' }
    ];

    const activeFiltersCount = Object.keys(filters).filter(k =>
        filters[k] && k !== 'search' && k !== 'sortBy'
    ).length;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
            {/* Main Search Bar */}
            <div className="p-4 flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search projects by title, description, or skills..."
                        value={filters.search || ''}
                        onChange={(e) => handleChange('search', e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                    <Button
                        variant="outline"
                        onClick={() => setIsExpanded(!isExpanded)}
                        className={`flex items-center gap-2 ${isExpanded || activeFiltersCount > 0 ? 'border-primary text-primary bg-primary/5' : ''}`}
                    >
                        <Filter size={18} />
                        Filters
                        {activeFiltersCount > 0 && (
                            <span className="bg-primary text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                {activeFiltersCount}
                            </span>
                        )}
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </Button>

                    {savedSearches?.length > 0 && (
                        <div className="relative group">
                            <Button variant="outline" className="flex items-center gap-2">
                                <Save size={18} />
                                Saved
                            </Button>
                            <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-100 hidden group-hover:block z-20 py-1">
                                <div className="px-3 py-2 text-xs font-semibold text-gray-400 border-b border-gray-50">
                                    Saved Searches
                                </div>
                                {savedSearches.map(search => (
                                    <button
                                        key={search.id}
                                        onClick={() => onApplySavedSearch(search)}
                                        className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors truncate"
                                    >
                                        {search.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Expanded Filters */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-gray-100 overflow-hidden"
                    >
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {/* Budget Range */}
                            <div className="space-y-3">
                                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                    <DollarSign size={16} className="text-primary" />
                                    Budget Range
                                </label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        placeholder="Min"
                                        value={filters.minBudget || ''}
                                        onChange={(e) => handleChange('minBudget', e.target.value)}
                                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                                    />
                                    <span className="text-gray-400">-</span>
                                    <input
                                        type="number"
                                        placeholder="Max"
                                        value={filters.maxBudget || ''}
                                        onChange={(e) => handleChange('maxBudget', e.target.value)}
                                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                                    />
                                </div>
                            </div>

                            {/* Duration */}
                            <div className="space-y-3">
                                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                    <Clock size={16} className="text-primary" />
                                    Project Duration
                                </label>
                                <select
                                    value={filters.maxDuration || ''}
                                    onChange={(e) => handleChange('maxDuration', e.target.value)}
                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary"
                                >
                                    <option value="">Any Duration</option>
                                    {durations.map(d => (
                                        <option key={d.value} value={d.value}>{d.label}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Complexity */}
                            <div className="space-y-3">
                                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                    <Briefcase size={16} className="text-primary" />
                                    Complexity Level
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {complexityLevels.map(level => (
                                        <button
                                            key={level}
                                            onClick={() => handleChange('complexity', filters.complexity === level ? '' : level)}
                                            className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-colors ${filters.complexity === level
                                                    ? 'bg-primary text-white'
                                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                }`}
                                        >
                                            {level}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Posted Date */}
                            <div className="space-y-3">
                                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                    <Calendar size={16} className="text-primary" />
                                    Posted After
                                </label>
                                <input
                                    type="date"
                                    value={filters.postedAfter ? filters.postedAfter.split('T')[0] : ''}
                                    onChange={(e) => handleChange('postedAfter', e.target.value)}
                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                                />
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="px-6 py-4 bg-gray-50/50 flex flex-col sm:flex-row justify-between items-center gap-4 border-t border-gray-100">
                            <div className="flex items-center gap-2 w-full sm:w-auto">
                                {!showSaveInput ? (
                                    <button
                                        onClick={() => setShowSaveInput(true)}
                                        className="text-sm text-primary font-medium hover:underline flex items-center gap-1"
                                    >
                                        <Save size={14} />
                                        Save search parameters
                                    </button>
                                ) : (
                                    <div className="flex items-center gap-2 w-full">
                                        <input
                                            type="text"
                                            placeholder="Name this search..."
                                            value={searchName}
                                            onChange={(e) => setSearchName(e.target.value)}
                                            className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
                                            autoFocus
                                        />
                                        <Button size="sm" onClick={handleSave} disabled={!searchName.trim()}>Save</Button>
                                        <button onClick={() => setShowSaveInput(false)} className="p-1 hover:bg-gray-200 rounded">
                                            <X size={16} />
                                        </button>
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={() => onFilterChange({})}
                                className="text-sm text-gray-500 hover:text-red-500 transition-colors flex items-center gap-1"
                            >
                                <X size={14} />
                                Clear All Filters
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Active Filters Display */}
            {activeFiltersCount > 0 && !isExpanded && (
                <div className="px-4 py-3 border-t border-gray-100 flex flex-wrap gap-2">
                    {Object.entries(filters).map(([key, value]) => {
                        if (!value || key === 'search' || key === 'sortBy') return null;
                        return (
                            <span key={key} className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary/5 text-primary text-xs rounded-full border border-primary/10">
                                <span className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                                {key === 'minBudget' || key === 'maxBudget' ? `$${value}` : value}
                                <button
                                    onClick={() => handleChange(key, '')}
                                    className="hover:bg-primary/20 rounded-full p-0.5 ml-1"
                                >
                                    <X size={10} />
                                </button>
                            </span>
                        );
                    })}
                    <button
                        onClick={() => onFilterChange({})}
                        className="text-xs text-gray-500 hover:text-primary underline ml-2"
                    >
                        Clear All
                    </button>
                </div>
            )}
        </div>
    );
};

export default AdvancedSearchPanel;
