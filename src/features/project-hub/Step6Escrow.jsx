import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Check, ShieldCheck, DollarSign, Wallet } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useProject } from '../../contexts/ProjectContext';
import { api } from '../../lib/api';

const Step6Escrow = ({ onReset }) => {
    const { currentProject } = useProject();
    const [sliderValue, setSliderValue] = useState(0);
    const [loading, setLoading] = useState(false);

    // States: 'loading', 'needs_funding', 'funded', 'released'
    const [status, setStatus] = useState('loading');
    const [history, setHistory] = useState([]);
    const [balance, setBalance] = useState(0);

    const contractAmount = currentProject?.budget ? parseFloat(currentProject.budget) : 1500; // Fallback or use contract specifically
    const expertName = 'Expert'; // Ideally fetch contract.expert_name or similar

    useEffect(() => {
        if (currentProject?.id) {
            checkEscrowStatus();
        }
    }, [currentProject, checkEscrowStatus]);

    const checkEscrowStatus = React.useCallback(async () => {
        try {
            setLoading(true);
            const txs = await api.transactions.getHistory(currentProject.id);
            setHistory(txs || []);

            // Calculate balance (simplified)
            const funded = txs.filter(t => t.type === 'escrow_funding').reduce((acc, t) => acc + parseFloat(t.amount), 0);
            const released = txs.filter(t => t.type === 'payment_release').reduce((acc, t) => acc + parseFloat(t.amount), 0);
            const currentBalance = funded - released;

            setBalance(currentBalance);

            if (released > 0 && currentBalance < 50) { // Nearly empty
                setStatus('released');
            } else if (currentBalance >= contractAmount * 0.9) { // Mostly funded
                setStatus('funded'); // Ready to release
            } else {
                setStatus('needs_funding');
            }
        } catch (error) {
            console.error("Error checking escrow:", error);
            setStatus('needs_funding'); // Default safe
        } finally {
            setLoading(false);
        }
    }, [currentProject, contractAmount]);

    const handleFundEscrow = async () => {
        try {
            setLoading(true);
            // Mock Funding Call
            await api.transactions.fund(currentProject.id, contractAmount);
            await checkEscrowStatus();
        } catch (error) {
            console.error("Funding error:", error);
            alert("Failed to fund escrow. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleSliderChange = async (e) => {
        const value = parseInt(e.target.value);
        setSliderValue(value);
        if (value >= 95 && !loading && status === 'funded') {
            setSliderValue(100);
            // Trigger release
            await handleRelease();
        }
    };

    const handleRelease = async () => {
        try {
            setLoading(true);
            await api.transactions.release(currentProject.id, balance);
            setStatus('released');
        } catch (error) {
            console.error("Release error:", error);
            setSliderValue(0);
            alert("Failed to release funds.");
        } finally {
            setLoading(false);
        }
    };

    if (loading && status === 'loading') return <div className="p-8 text-center">Loading status...</div>;

    return (
        <div className="max-w-2xl mx-auto text-center">
            {status === 'needs_funding' && (
                <div className="mb-8">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
                        <Wallet size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Fund Escrow</h2>
                    <p className="text-gray-600 mb-6">Secure the project funds in Escrow before work begins.</p>

                    <Card className="p-8 mb-8">
                        <div className="text-center mb-6">
                            <p className="text-sm text-gray-500 mb-1">Total Budget</p>
                            <p className="text-4xl font-bold text-gray-900">${contractAmount.toLocaleString()}</p>
                        </div>
                        <Button size="lg" className="w-full" onClick={handleFundEscrow} disabled={loading}>
                            {loading ? 'Processing...' : `Fund $${contractAmount.toLocaleString()} via Stripe`}
                        </Button>
                        <p className="text-xs text-gray-400 mt-4 flex items-center justify-center gap-1">
                            <ShieldCheck size={12} /> Funds are held securely until you approve the work.
                        </p>
                    </Card>
                </div>
            )}

            {status === 'funded' && (
                <>
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Release Milestone Payment</h2>
                        <p className="text-gray-600">Work completed? Slide to release funds to {expertName}.</p>
                    </div>

                    <Card className="p-8 mb-8">
                        <div className="flex items-center justify-between mb-8 pb-8 border-b border-gray-100">
                            <div className="text-left">
                                <p className="text-sm text-gray-500 mb-1">Escrow Balance</p>
                                <p className="text-3xl font-bold text-success">${balance.toLocaleString()}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-gray-500 mb-1">Milestone</p>
                                <p className="text-lg font-medium text-gray-900">Project Completion</p>
                            </div>
                        </div>

                        <div className="relative h-16 bg-gray-100 rounded-full overflow-hidden select-none">
                            <div
                                className="absolute top-0 left-0 h-full bg-success/20 transition-all duration-75"
                                style={{ width: `${sliderValue}%` }}
                            />

                            <div className="absolute inset-0 flex items-center justify-center text-gray-400 font-medium pointer-events-none">
                                {loading ? 'Releasing...' : 'Slide to Release Payment'}
                            </div>

                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={sliderValue}
                                onChange={handleSliderChange}
                                disabled={loading}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                            />

                            <div
                                className="absolute top-1 bottom-1 left-1 w-14 bg-white rounded-full shadow-md flex items-center justify-center text-success transition-all duration-75 pointer-events-none"
                                style={{ left: `calc(${sliderValue}% - ${sliderValue * 0.6}px)` }}
                            >
                                <ChevronRight size={24} />
                            </div>
                        </div>
                    </Card>
                </>
            )}

            {status === 'released' && (
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-success/5 rounded-3xl p-8 border border-success/20 max-w-lg mx-auto"
                >
                    <div className="w-20 h-20 bg-success rounded-full flex items-center justify-center mx-auto mb-6 text-white shadow-xl shadow-success/30">
                        <Check size={40} />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Payment Complete!</h3>
                    <p className="text-gray-600 mb-8">
                        Funds have been successfully transferred to the expert.
                    </p>

                    <div className="bg-white rounded-xl p-4 border border-gray-100 mb-8 flex items-center justify-center gap-2 text-sm text-gray-500">
                        <ShieldCheck size={16} className="text-success" />
                        <span>Transaction Secure • ID: #TX-{Math.floor(Math.random() * 10000)}</span>
                    </div>

                    <Button variant="outline" onClick={onReset}>
                        Back to Project Hub
                    </Button>
                </motion.div>
            )}

            {/* History Link */}
            {history.length > 0 && status !== 'released' && (
                <div className="mt-8 text-sm text-gray-400">
                    <p>Transaction History: {history.length} events</p>
                </div>
            )}
        </div>
    );
};

export { Step6Escrow };
