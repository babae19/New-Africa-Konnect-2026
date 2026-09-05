import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Search, X, Plus, Loader2 } from 'lucide-react';
import { Button } from './ui/Button';

const SkillSelector = ({ selectedSkills = [], onChange }) => {
    const [categories, setCategories] = useState([]);
    const [allSkills, setAllSkills] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searching, setSearching] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState('all');

    useEffect(() => {
        loadSkillsData();
    }, []);

    useEffect(() => {
        if (searchTerm.length >= 2) {
            searchSkills();
        } else {
            setSearchResults([]);
        }
    }, [searchTerm]);

    const loadSkillsData = async () => {
        try {
            const [categoriesData, skillsData] = await Promise.all([
                api.experts.getCategories(),
                api.experts.getSkills()
            ]);
            setCategories(categoriesData.categories || []);
            setAllSkills(skillsData.skills || []);
        } catch (error) {
            console.error('Failed to load skills:', error);
        } finally {
            setLoading(false);
        }
    };

    const searchSkills = async () => {
        setSearching(true);
        try {
            const data = await api.experts.searchSkills(searchTerm);
            setSearchResults(data.skills || []);
        } catch (error) {
            console.error('Search failed:', error);
        } finally {
            setSearching(false);
        }
    };

    const handleAddSkill = (skill) => {
        if (!selectedSkills.find(s => s.id === skill.id)) {
            onChange([...selectedSkills, skill]);
        }
        setSearchTerm('');
        setSearchResults([]);
    };

    const handleRemoveSkill = (skillId) => {
        onChange(selectedSkills.filter(s => s.id !== skillId));
    };

    const getFilteredSkills = () => {
        if (selectedCategory === 'all') return allSkills;
        return allSkills.filter(s => s.category === selectedCategory);
    };

    const displaySkills = searchTerm.length >= 2 ? searchResults : getFilteredSkills();

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8">
                <Loader2 className="animate-spin text-primary" size={32} />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Selected Skills */}
            {selectedSkills.length > 0 && (
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Selected Skills ({selectedSkills.length})
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {selectedSkills.map((skill) => (
                            <span
                                key={skill.id}
                                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary text-white"
                            >
                                {skill.skill_name}
                                <button
                                    onClick={() => handleRemoveSkill(skill.id)}
                                    className="ml-2 hover:text-red-200"
                                >
                                    <X size={14} />
                                </button>
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Search */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Search Skills
                </label>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search for skills..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                    {searching && (
                        <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 animate-spin text-gray-400" size={20} />
                    )}
                </div>
            </div>

            {/* Category Filter */}
            {searchTerm.length < 2 && (
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Filter by Category
                    </label>
                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                        <option value="all">All Categories</option>
                        {categories.map((category) => (
                            <option key={category} value={category}>
                                {category}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {/* Skills List */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Available Skills
                </label>
                <div className="border border-gray-300 rounded-lg max-h-64 overflow-y-auto">
                    {displaySkills.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">
                            {searchTerm.length >= 2 ? 'No skills found' : 'No skills available'}
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-200">
                            {displaySkills.map((skill) => {
                                const isSelected = selectedSkills.find(s => s.id === skill.id);
                                return (
                                    <div
                                        key={skill.id}
                                        className={`p-3 hover:bg-gray-50 cursor-pointer ${isSelected ? 'bg-gray-100' : ''
                                            }`}
                                        onClick={() => !isSelected && handleAddSkill(skill)}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-medium text-gray-900">
                                                    {skill.skill_name}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {skill.category}
                                                    {skill.subcategory && ` • ${skill.subcategory}`}
                                                </p>
                                            </div>
                                            {!isSelected && (
                                                <Plus size={20} className="text-primary" />
                                            )}
                                        </div>
                                        {skill.description && (
                                            <p className="text-sm text-gray-600 mt-1">
                                                {skill.description}
                                            </p>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SkillSelector;
