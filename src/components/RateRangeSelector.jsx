import React, { useState } from 'react';
import { api } from '../lib/api';
import { Button } from './ui/Button';
import { DollarSign, Loader2 } from 'lucide-react';

const RateRangeSelector = ({ userId, initialMin, initialMax, initialCurrency = 'USD', onUpdate }) => {
    const [min, setMin] = useState(initialMin || '');
    const [max, setMax] = useState(initialMax || '');
    const [currency, setCurrency] = useState(initialCurrency);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSave = async () => {
        setError('');

        // Validation
        if (!min || !max) {
            setError('Please enter both minimum and maximum rates');
            return;
        }

        const minNum = parseFloat(min);
        const maxNum = parseFloat(max);

        if (isNaN(minNum) || isNaN(maxNum)) {
            setError('Please enter valid numbers');
            return;
        }

        if (minNum <= 0 || maxNum <= 0) {
            setError('Rates must be greater than zero');
            return;
        }

        if (minNum >= maxNum) {
            setError('Minimum rate must be less than maximum rate');
            return;
        }

        setLoading(true);
        try {
            const data = await api.experts.setRateRange(minNum, maxNum, currency);
            onUpdate({
                min: data.rateMin,
                max: data.rateMax,
                currency: data.rateCurrency
            });
        } catch (error) {
            console.error('Failed to update rate range:', error);
            setError(error.message || 'Failed to update rate range');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hourly Rate Range
                </label>
                <p className="text-sm text-gray-600 mb-4">
                    Set your minimum and maximum hourly rates. Clients will see this range when browsing experts.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Currency */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Currency
                    </label>
                    <select
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="GBP">GBP (£)</option>
                        <option value="NGN">NGN (₦)</option>
                        <option value="GHS">GHS (₵)</option>
                        <option value="KES">KES (KSh)</option>
                        <option value="ZAR">ZAR (R)</option>
                    </select>
                </div>

                {/* Minimum Rate */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Minimum Rate
                    </label>
                    <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="number"
                            value={min}
                            onChange={(e) => setMin(e.target.value)}
                            placeholder="50"
                            min="0"
                            step="1"
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                    </div>
                </div>

                {/* Maximum Rate */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Maximum Rate
                    </label>
                    <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="number"
                            value={max}
                            onChange={(e) => setMax(e.target.value)}
                            placeholder="150"
                            min="0"
                            step="1"
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                    </div>
                </div>
            </div>

            {/* Preview */}
            {min && max && parseFloat(min) < parseFloat(max) && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-900">
                        <strong>Preview:</strong> Your rate will be displayed as{' '}
                        <span className="font-bold">
                            {currency} {min} - {max}/hour
                        </span>
                    </p>
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-800">{error}</p>
                </div>
            )}

            {/* Save Button */}
            <Button
                onClick={handleSave}
                disabled={loading}
                className="w-full md:w-auto"
            >
                {loading ? (
                    <>
                        <Loader2 className="animate-spin mr-2" size={16} />
                        Saving...
                    </>
                ) : (
                    'Save Rate Range'
                )}
            </Button>

            {/* Info */}
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-xs text-gray-600">
                    <strong>Tip:</strong> Setting a range gives you flexibility to negotiate based on project complexity and duration. Most experts set a range of $20-50 difference.
                </p>
            </div>
        </div>
    );
};

export default RateRangeSelector;
