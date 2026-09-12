import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { FileSignature, ShieldCheck, Download, Check, Edit2, Save } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useProject } from '../../contexts/ProjectContext';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../lib/api';
import { useNavigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';

const Step4Contract = ({ onNext, project, hideProceed, liveContract }) => {
    const navigate = useNavigate();
    const { currentProject: contextProject } = useProject();
    // Use passed project or fallback to context
    const currentProject = project || contextProject;

    const { user } = useAuth();
    const [contract, setContract] = useState(null);
    const [isSigned, setIsSigned] = useState(false);
    const [showConfetti, setShowConfetti] = useState(false);
    // const [loading, setLoading] = useState(true); // Unused

    // Edit Mode State
    const [isEditing, setIsEditing] = useState(false);
    const [terms, setTerms] = useState('');
    const [amount, setAmount] = useState('');
    const [saving, setSaving] = useState(false);
    const [generating, setGenerating] = useState(false);

    const [escrowFunded, setEscrowFunded] = useState(false);
    const [funding, setFunding] = useState(false);

    // Derived State
    const isExpertAccepted = currentProject?.expert_status === 'accepted';
    const isExpertPending = currentProject?.expert_status === 'pending';
    const expertStatus = currentProject?.expert_status;
    const isClientParty = contract?.client_id === user?.id;
    const hasSigned = Boolean(isClientParty ? contract?.client_signed_at : contract?.expert_signed_at);
    const hasAnySignature = Boolean(contract?.client_signed_at || contract?.expert_signed_at);
    const isLocked = Boolean(contract?.locked_at || contract?.status === 'signed');

    useEffect(() => {
        if (!liveContract) return;
        setContract(liveContract);
        setTerms(liveContract.terms || '');
        setAmount(liveContract.amount || '');
        setIsSigned(Boolean(liveContract.client_id === user?.id ? liveContract.client_signed_at : liveContract.expert_signed_at));
        if (liveContract.client_signed_at || liveContract.expert_signed_at) setIsEditing(false);
    }, [liveContract, user?.id]);

    useEffect(() => {
        const fetchContract = async () => {
            if (!currentProject?.id) return;
            try {
                // Fetch contracts for this project
                const contracts = await api.contracts.getByProject(currentProject.id);
                // Assume the most recent one is active
                const activeContract = contracts.contracts ? contracts.contracts[0] : (Array.isArray(contracts) ? contracts[0] : null);

                if (activeContract) {
                    setContract(activeContract);
                    setTerms(activeContract.terms || '');
                    setAmount(activeContract.amount || '');
                    // Check if *current user* has signed?
                    setIsSigned(Boolean(activeContract.client_id === user?.id ? activeContract.client_signed_at : activeContract.expert_signed_at));
                }
            } catch (error) {
                console.error("Failed to fetch contract", error);
            }
        };

        if (currentProject && (isExpertAccepted || currentProject.status === 'active')) {
            fetchContract();
        }
    }, [currentProject, isExpertAccepted, user?.id]);


    const generateContract = async () => {
        if (!currentProject?.selected_expert_id) return;
        setGenerating(true);
        const toastId = toast.loading('Creating contract template...');
        const templateTerms = `INDEPENDENT CONTRACTOR AGREEMENT

This Agreement is entered into as of ${new Date().toLocaleDateString()} between ${user.name} ("Client") and ${currentProject.expert_name || 'Expert'} ("Contractor").

1. SERVICES
Contractor agrees to provide the following services:
${currentProject.description || 'As described in project details.'}

2. COMPENSATION
Client agrees to pay Contractor a total of $${currentProject.budget || '0.00'}.

3. TERM
This Agreement shall commence on ${new Date().toLocaleDateString()} and continue until completion of the services.

4. INDEPENDENT CONTRACTOR RELATIONSHIP
Contractor is an independent contractor and not an employee of Client.`;

        setTerms(templateTerms);
        setAmount(currentProject.budget || '');

        try {
            const newContract = contract
                ? await api.contracts.update(contract.id, { terms: templateTerms, amount: parseFloat(currentProject.budget || 0) })
                : await api.contracts.create({
                    projectId: currentProject.id,
                    expertId: currentProject.selected_expert_id,
                    terms: templateTerms,
                    amount: parseFloat(currentProject.budget || 0)
                });
            setContract(newContract);
            toast.success('Contract template created.', { id: toastId });
        } catch (error) {
            console.error("Contract template creation failed", error);
            toast.error("Could not create contract. Please try again.", { id: toastId });
        } finally {
            setGenerating(false);
        }
    };

    const handleSave = async () => {
        if (!contract) return;
        setSaving(true);
        try {
            const updated = await api.contracts.update(contract.id, {
                terms,
                amount: parseFloat(amount)
            });
            setContract(updated);
            setIsEditing(false);
        } catch (error) {
            console.error("Failed to save", error);
        } finally {
            setSaving(false);
        }
    };

    const handleSign = async () => {
        if (!contract) return;
        const toastId = toast.loading('Signing contract...');
        try {
            const updated = await api.contracts.sign(contract.id, {
                consent: true
            });
            setContract(updated);
            setIsSigned(true);
            setShowConfetti(true);
            toast.success('Contract signed successfully!', { id: toastId });
            setTimeout(() => setShowConfetti(false), 5000);
        } catch (error) {
            console.error("Failed to sign", error);
            toast.error("Failed to sign contract", { id: toastId });
        }
    };

    // ...

    const handleFundEscrow = async () => {
        const toastId = toast.loading('Processing payment...');
        try {
            setFunding(true);
            // In a real app, this would redirect to Stripe/PayPal
            // Here we verify intent and mock the transaction
            await api.payments.initEscrow(currentProject.id, amount || 0);
            setEscrowFunded(true);
            toast.success("Escrow Funded Successfully! Project is Active.", { id: toastId });
            // Trigger project status update to 'active' if not already
            setTimeout(() => onNext(), 1500); // Delay slightly for user to see success
        } catch (error) {
            console.error("Funding failed", error);
            toast.error("Payment failed: " + error.message, { id: toastId });
        } finally {
            setFunding(false);
        }
    };

    const handleProceed = () => {
        onNext();
    };

    if (isLocked && !escrowFunded && !hideProceed && user?.role === 'client') {
        return (
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Fund Escrow</h2>
                    <p className="text-gray-600">Secure the project by funding the escrow account.</p>
                </div>

                <Card className="p-8 text-center space-y-6">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                        <ShieldCheck size={40} className="text-green-600" />
                    </div>

                    <div>
                        <h3 className="text-xl font-bold text-gray-900">Contract Signed!</h3>
                        <p className="text-gray-600 mt-2">
                            To activate the project and allow the expert to begin, please fund the agreed amount of <span className="font-bold text-gray-900">${amount}</span>.
                        </p>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-800 text-left max-w-md mx-auto">
                        <p className="font-semibold mb-1">🛡️ Africa Konnect Protection</p>
                        <p>Funds are held securely in escrow and only released when you approve milestones.</p>
                    </div>

                    <Button
                        size="lg"
                        onClick={handleFundEscrow}
                        disabled={funding}
                        className="w-full max-w-sm"
                    >
                        {funding ? 'Processing Secure Payment...' : `Fund $${amount} & Activate Project`}
                    </Button>
                </Card>
            </div>
        );
    }


    if (isExpertPending) {
        return (
            <div className="max-w-4xl mx-auto text-center py-12">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 inline-block mb-8">
                    <div className="animate-pulse flex flex-col items-center">
                        <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
                            <span className="text-2xl">⏳</span>
                        </div>
                        <h3 className="text-xl font-bold text-yellow-800 mb-2">Waiting for Expert Acceptance</h3>
                        <p className="text-yellow-700">
                            We've sent your invitation to the expert. Once they accept, you can proceed to sign the contract.
                        </p>
                    </div>
                </div>
                <p className="text-gray-500 text-sm">You will be notified when they accept.</p>
            </div>
        );
    }

    if (!isExpertAccepted && expertStatus !== 'none') {
        return (
            <div className="max-w-4xl mx-auto text-center py-12">
                <h3 className="text-xl font-bold text-red-600 mb-2">Expert Declined</h3>
                <p className="text-gray-600">The expert has declined the invitation. Please go back and select another expert.</p>
                <Button variant="secondary" className="mt-4" onClick={() => navigate(-1)}>Back to Matches</Button>
            </div>
        );
    }

    const handleDownload = () => {
        if (!contract) return;
        const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        let y = 22;
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(16);
        pdf.text('INDEPENDENT CONTRACTOR AGREEMENT', pageWidth / 2, y, { align: 'center' });
        y += 12;
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(10);
        const lines = pdf.splitTextToSize(contract.terms || terms || '', pageWidth - 30);
        lines.forEach(line => {
            if (y > pageHeight - 25) { pdf.addPage(); y = 20; }
            pdf.text(line, 15, y);
            y += 5;
        });
        if (y > pageHeight - 45) { pdf.addPage(); y = 20; }
        y += 7;
        pdf.setFont('helvetica', 'bold');
        pdf.text(`Contract value: $${contract.amount || amount || 0}`, 15, y);
        y += 9;
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Client: ${contract.client_name || 'Client'} — ${contract.client_signed_at ? `signed ${new Date(contract.client_signed_at).toLocaleString()}` : 'not signed'}`, 15, y);
        y += 6;
        pdf.text(`Expert: ${contract.expert_name || 'Expert'} — ${contract.expert_signed_at ? `signed ${new Date(contract.expert_signed_at).toLocaleString()}` : 'not signed'}`, 15, y);
        y += 8;
        pdf.setFontSize(8);
        pdf.text(isLocked ? 'Final locked copy. Both parties have electronically signed.' : 'Draft copy — signatures are not yet complete.', 15, y);
        pdf.save(`Contract_${currentProject.id}${isLocked ? '_SIGNED' : '_DRAFT'}.pdf`);
    };

    // Either named party can develop the draft. The first signature freezes its contents.
    const canEdit = Boolean(contract) && !hasAnySignature && !isLocked;

    return (
        <div className="max-w-4xl mx-auto relative">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Smart Contract Agreement</h2>
                <p className="text-gray-600">Review and sign the engagement contract.</p>
            </div>

            <Card className={`p-0 overflow-hidden border-2 ${isLocked ? 'border-success/50' : 'border-gray-100'}`}>
                <div className="bg-gray-50 p-4 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-gray-700">
                        <FileSignature size={20} />
                        <span className="font-semibold">Engagement_Contract_v1.0.pdf</span>
                    </div>
                    <div className="flex items-center gap-2">
                        {((canEdit || (!contract && user?.role === 'client')) && !isEditing) && (
                            <>
                                <Button variant="ghost" size="sm" onClick={generateContract} disabled={generating} className="text-purple-600 hover:text-purple-700 hover:bg-purple-50">
                                    <FileSignature size={16} className="mr-2" />
                                    {generating ? 'Creating...' : 'Use Contract Template'}
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)} disabled={!contract}>
                                    <Edit2 size={16} className="mr-2" />
                                    Edit Terms
                                </Button>
                            </>
                        )}
                        {isEditing && (
                            <Button variant="primary" size="sm" onClick={handleSave} disabled={saving}>
                                <Save size={16} className="mr-2" />
                                {saving ? 'Saving...' : 'Save Changes'}
                            </Button>
                        )}
                        <Button variant="ghost" size="sm" className="text-gray-500" onClick={handleDownload} disabled={!contract}>
                            <Download size={16} className="mr-2" />
                            Download PDF
                        </Button>
                    </div>
                </div>

                <div className="p-8 max-h-[500px] overflow-y-auto bg-white">
                    <div className="font-serif text-gray-700 leading-relaxed text-sm space-y-4">
                        <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">INDEPENDENT CONTRACTOR AGREEMENT</h3>
                        <p>
                            This Agreement is made between <strong>Client</strong> and <strong>Expert</strong>.
                        </p>

                        <div className="bg-gray-50 p-6 rounded-lg border border-gray-100 space-y-4">
                            <div>
                                <h4 className="font-bold text-gray-900 uppercase text-xs mb-2">Scope & Terms</h4>
                                {isEditing ? (
                                    <textarea
                                        className="w-full h-40 p-3 border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                                        value={terms}
                                        onChange={(e) => setTerms(e.target.value)}
                                        placeholder="Enter contract terms here..."
                                    />
                                ) : (
                                    <div className="whitespace-pre-wrap">{terms || 'Standard Agreement Terms...'}</div>
                                )}
                            </div>

                            <div>
                                <h4 className="font-bold text-gray-900 uppercase text-xs mb-2">Total Contract Value</h4>
                                <div className="flex items-center gap-2">
                                    <span className="text-lg font-bold text-gray-400">$</span>
                                    {isEditing ? (
                                        <input
                                            type="number"
                                            className="p-2 border rounded-md w-32 focus:ring-2 focus:ring-primary focus:border-transparent font-bold text-gray-900"
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                        />
                                    ) : (
                                        <span className="text-lg font-bold text-gray-900">{amount}</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="h-10"></div>
                        <p className="text-xs text-gray-500 italic text-center">
                            By electronically signing, both parties agree to the terms set forth above.
                        </p>
                    </div>
                </div>

                <div className="bg-gray-50 p-6 border-t border-gray-100">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                            <div className={`w-12 h-12 border-2 border-dashed rounded-lg flex items-center justify-center ${isSigned ? 'bg-success/10 border-success text-success' : 'bg-white border-gray-300 text-gray-400'}`}>
                                {isSigned ? <Check size={24} /> : <span className="text-xs">Sign</span>}
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-900">
                                    {hasSigned ? 'You have signed' : isLocked ? 'Fully signed & locked' : 'Digital Signature'}
                                </p>
                                <p className="text-xs text-gray-500">
                                    {hasSigned ? 'Your electronic signature is recorded' : 'Click sign to accept the frozen terms'}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">Client: {contract?.client_signed_at ? 'Signed' : 'Awaiting signature'} · Expert: {contract?.expert_signed_at ? 'Signed' : 'Awaiting signature'}</p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <Button
                                size="lg"
                                onClick={handleSign}
                                disabled={hasSigned || isEditing || !contract || isLocked}
                                className={hasSigned ? "bg-success hover:bg-success cursor-default" : ""}
                            >
                                {isSigned ? (
                                    <>
                                        <ShieldCheck className="mr-2" size={20} />
                                        Signed successfully
                                    </>
                                ) : (
                                    "Sign & Accept Contract"
                                )}
                            </Button>

                            {isLocked && !hideProceed && (
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                >
                                    <Button size="lg" onClick={handleProceed}>
                                        Proceed to Collaboration Hub
                                    </Button>
                                </motion.div>
                            )}
                        </div>
                    </div>
                </div>
            </Card>

            <AnimatePresence>
                {showConfetti && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                    >
                        <div className="text-6xl">🎉</div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export { Step4Contract };
