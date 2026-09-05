import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { CreditCard, Lock, CheckCircle, Clock, AlertCircle, DollarSign, Download, ArrowRight, Calendar } from 'lucide-react';

const PaymentDashboard = ({ projectId }) => {
    const { isClient, isExpert } = useAuth();
    const [escrow, setEscrow] = useState(null);
    const [milestones, setMilestones] = useState([]);
    // const [releases, setReleases] = useState([]); // Unused for now
    const [loading, setLoading] = useState(true);
    const [initAmount, setInitAmount] = useState('');

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            const [escrowData, milestonesData] = await Promise.all([
                api.payments.getEscrow(projectId).catch(() => null),
                api.milestones.getByProject(projectId),
                // api.transactions.getHistory(projectId) // Unused
            ]);

            setEscrow(escrowData);
            setMilestones(milestonesData || []);
            // setReleases(releaseData || []);
        } catch (error) {
            console.error('Failed to load payment data', error);
        } finally {
            setLoading(false);
        }
    }, [projectId]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleInitEscrow = async (e) => {
        e.preventDefault();
        try {
            await api.payments.initEscrow(projectId, parseFloat(initAmount));
            loadData(); // Reload to see new escrow state
        } catch (error) {
            console.error('Failed to initialize escrow', error);
            alert('Failed to fund escrow: ' + error.message);
        }
    };

    const handleRequestRelease = async (milestoneId, amount) => {
        try {
            await api.payments.requestRelease(projectId, { milestoneId, amount });
            loadData();
        } catch (error) {
            console.error('Failed to request release', error);
        }
    };

    const handleApproveRelease = async (releaseId) => {
        if (!confirm('Are you sure you want to release these funds? This action cannot be undone.')) return;
        try {
            await api.payments.approveRelease(projectId, releaseId);
            loadData();
        } catch (error) {
            console.error('Failed to approve release', error);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-400">Loading payments...</div>;

    const totalBudget = milestones.reduce((sum, m) => sum + parseFloat(m.amount || 0), 0);
    const totalReleased = escrow?.released_amount || 0;
    const totalHeld = escrow?.held_amount || 0;

    return (
        <div className="space-y-6">
            {/* Escrow Summary Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <Lock className="w-5 h-5 text-primary" />
                            Escrow Protection
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                            Funds are held securely until milestones are approved.
                        </p>
                    </div>
                    <div className="text-right">
                        <div className="text-sm text-gray-500">Total Project Value</div>
                        <div className="text-2xl font-bold text-gray-900">${totalBudget.toLocaleString()}</div>
                    </div>
                </div>

                {escrow ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                            <div className="text-sm font-medium text-blue-600 mb-1 flex items-center gap-2">
                                <Lock className="w-4 h-4" /> Funds in Escrow
                            </div>
                            <div className="text-2xl font-bold text-blue-900">${parseFloat(totalHeld).toLocaleString()}</div>
                        </div>
                        <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                            <div className="text-sm font-medium text-green-600 mb-1 flex items-center gap-2">
                                <CheckCircle className="w-4 h-4" /> Released to Expert
                            </div>
                            <div className="text-2xl font-bold text-green-900">${parseFloat(totalReleased).toLocaleString()}</div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                            <div className="text-sm font-medium text-gray-600 mb-1 flex items-center gap-2">
                                <Clock className="w-4 h-4" /> Remaining
                            </div>
                            <div className="text-2xl font-bold text-gray-900">
                                ${(totalBudget - totalReleased).toLocaleString()}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                        <AlertCircle className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                        <h3 className="text-lg font-medium text-gray-900 mb-1">Escrow Not Funded</h3>
                        <p className="text-gray-500 mb-4 max-w-md mx-auto">
                            To start this project, the agreed amount needs to be deposited into the secure escrow account.
                        </p>
                        {isClient && (
                            <form onSubmit={handleInitEscrow} className="flex gap-2 max-w-xs mx-auto">
                                <div className="relative flex-1">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                                    <input
                                        type="number"
                                        value={initAmount}
                                        onChange={e => setInitAmount(e.target.value)}
                                        placeholder="Amount"
                                        className="w-full pl-7 pr-4 py-2 border rounded-lg"
                                        required
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className="bg-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-primary/90"
                                >
                                    Fund Now
                                </button>
                            </form>
                        )}
                        {isExpert && (
                            <div className="text-sm text-amber-600 bg-amber-50 inline-block px-4 py-2 rounded-full font-medium">
                                Waiting for client to fund escrow
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Milestones & Releases */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                    <h3 className="font-bold text-gray-800">Payment Milestones</h3>
                    <button className="text-sm text-primary font-medium flex items-center gap-1 hover:underline">
                        <Download className="w-4 h-4" /> Download Invoices
                    </button>
                </div>
                <div className="divide-y divide-gray-100">
                    {milestones.length === 0 && (
                        <div className="p-8 text-center text-gray-400">
                            No milestones defined for this contract.
                        </div>
                    )}
                    {milestones.map((milestone) => (
                        <div key={milestone.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-gray-50/50 transition-colors">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-1">
                                    <h4 className="font-bold text-gray-900">{milestone.title}</h4>
                                    <StatusBadge status={milestone.status} />
                                </div>
                                <p className="text-sm text-gray-500">{milestone.description}</p>
                                <div className="mt-2 flex items-center gap-4 text-xs text-gray-400">
                                    <span className="flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        Due {new Date(milestone.due_date).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center gap-6">
                                <div className="text-right">
                                    <div className="text-lg font-bold text-gray-900">${parseFloat(milestone.amount).toLocaleString()}</div>
                                    <div className="text-xs text-gray-500">Amount</div>
                                </div>

                                {/* Actions */}
                                <div className="w-40 flex justify-end">
                                    {milestone.status === 'completed' ? (
                                        <div className="flex flex-col items-center">
                                            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center mb-1">
                                                <CheckCircle className="w-5 h-5 text-green-600" />
                                            </div>
                                            <span className="text-xs font-medium text-green-700">Paid</span>
                                        </div>
                                    ) : milestone.status === 'pending_release' ? (
                                        isClient ? (
                                            <button
                                                onClick={() => handleApproveRelease(milestone.releaseId)} // Need releaseId from milestone or separate mapping
                                                className="w-full bg-green-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-green-700 shadow-sm shadow-green-200"
                                            >
                                                Approve Release
                                            </button>
                                        ) : (
                                            <div className="text-center px-3 py-2 bg-amber-50 text-amber-700 rounded-lg text-sm font-medium border border-amber-100">
                                                Pending Approval
                                            </div>
                                        )
                                    ) : (
                                        isExpert ? (
                                            <button
                                                onClick={() => handleRequestRelease(milestone.id, milestone.amount)}
                                                disabled={!escrow}
                                                className="w-full bg-white border-2 border-primary text-primary px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                Request Release
                                            </button>
                                        ) : (
                                            <span className="text-sm text-gray-400 italic">Work in progress</span>
                                        )
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const StatusBadge = ({ status }) => {
    const styles = {
        pending: 'bg-gray-100 text-gray-600',
        in_progress: 'bg-blue-100 text-blue-700',
        completed: 'bg-green-100 text-green-700',
        pending_release: 'bg-amber-100 text-amber-700'
    };

    const label = status?.replace('_', ' ');

    return (
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${styles[status] || styles.pending}`}>
            {label}
        </span>
    );
};

export default PaymentDashboard;
