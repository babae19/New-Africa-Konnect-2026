import React, { useState, useRef } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Sparkles, X, FileText, Copy, Check, Loader2, ChevronDown } from 'lucide-react';
import { api } from '../lib/api';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

const AIDraftModal = ({ isOpen, onClose, onSave, project, clientName, expertName }) => {
    const [prompt, setPrompt]             = useState('');
    const [streaming, setStreaming]       = useState(false);
    const [generatedText, setGeneratedText] = useState('');
    const [copied, setCopied]             = useState(false);
    const [showPreset, setShowPreset]     = useState(false);
    const outputRef                       = useRef(null);

    const presets = [
        { label: 'Freelance Development Contract', text: `Draft a professional freelance software development contract between client "${clientName || 'Client'}" and expert "${expertName || 'Expert'}" for the project "${project?.title || 'Project'}". Include: scope of work, payment terms at $${project?.budget || 'TBD'}, IP ownership, confidentiality, revision policy, and termination clause.` },
        { label: 'NDA (Non-Disclosure Agreement)', text: `Create a mutual Non-Disclosure Agreement between "${clientName || 'Client'}" and "${expertName || 'Expert'}" for collaboration on "${project?.title || 'a confidential project'}". Include: definition of confidential info, exclusions, duration of 2 years, permitted disclosures, and remedies.` },
        { label: 'Milestone-Based Agreement', text: `Write a milestone-based project agreement for "${project?.title || 'Project'}" between "${clientName || 'Client'}" and "${expertName || 'Expert'}". Total budget: $${project?.budget || 'TBD'}. Include 3 milestones with 33% payment each, acceptance criteria per milestone, and revision rounds.` },
    ];

    if (!isOpen) return null;

    const handleGenerate = async () => {
        if (!prompt.trim()) { toast.error('Please describe the contract you need.'); return; }
        setStreaming(true);
        setGeneratedText('');

        try {
            const fullPrompt = `You are a professional legal contract writer. Generate a complete, well-structured contract document based on this request:\n\n${prompt}\n\nFormat with clear sections, numbered clauses, and professional legal language. Include signature blocks at the end.`;

            await api.ai.chatStream(fullPrompt, { currentPath: '/collaboration', userName: clientName, userRole: 'client' }, (chunk) => {
                setGeneratedText(prev => prev + chunk);
                // Auto-scroll output
                if (outputRef.current) {
                    outputRef.current.scrollTop = outputRef.current.scrollHeight;
                }
            });
        } catch (err) {
            console.error('AI Draft error:', err);
            toast.error('Failed to generate contract. Please try again.');
        } finally {
            setStreaming(false);
        }
    };

    const handleCopy = async () => {
        await navigator.clipboard.writeText(generatedText);
        setCopied(true);
        toast.success('Contract copied to clipboard!');
        setTimeout(() => setCopied(false), 2000);
    };

    const handleSave = () => {
        if (!generatedText) { toast.error('No contract to save yet.'); return; }
        onSave?.(generatedText);
        toast.success('Contract saved!');
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.97 }}
                className="w-full max-w-3xl max-h-[90vh] flex flex-col bg-white rounded-2xl shadow-2xl overflow-hidden"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-violet-50 to-white flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center">
                            <Sparkles size={18} className="text-violet-600" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 text-base">AI Contract Drafting</h3>
                            <p className="text-[11px] text-gray-400">Describe what you need — AI will generate it in real-time</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                        <X size={18} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {/* Prompt area */}
                    <div className="p-6 border-b border-gray-50">
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Your Prompt</label>
                            <div className="relative">
                                <button
                                    onClick={() => setShowPreset(!showPreset)}
                                    className="flex items-center gap-1 text-xs font-semibold text-violet-600 hover:text-violet-800 transition-colors"
                                >
                                    Use Template <ChevronDown size={12} className={`transition-transform ${showPreset ? 'rotate-180' : ''}`} />
                                </button>
                                <AnimatePresence>
                                    {showPreset && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -8 }}
                                            className="absolute right-0 top-6 w-72 bg-white border border-gray-100 rounded-xl shadow-xl z-10"
                                        >
                                            {presets.map((p, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() => { setPrompt(p.text); setShowPreset(false); }}
                                                    className="w-full text-left px-4 py-3 text-sm hover:bg-violet-50 transition-colors first:rounded-t-xl last:rounded-b-xl border-b border-gray-50 last:border-0"
                                                >
                                                    <span className="font-semibold text-gray-800 block">{p.label}</span>
                                                    <span className="text-[11px] text-gray-400 line-clamp-1">{p.text.substring(0, 60)}…</span>
                                                </button>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                        <textarea
                            value={prompt}
                            onChange={e => setPrompt(e.target.value)}
                            placeholder={`Describe the contract you need...\n\nExample: "Draft a freelance contract between ${clientName || 'TechCorp'} and ${expertName || 'Jane Doe'} for a 3-month React development project worth $5,000, with monthly milestone payments."`}
                            rows={5}
                            className="w-full px-4 py-3 text-sm rounded-xl border-2 border-gray-200 focus:border-violet-400 focus:ring-4 focus:ring-violet-50 resize-none transition-all outline-none text-gray-800 placeholder:text-gray-300"
                        />
                        <div className="flex items-center justify-between mt-3">
                            <p className="text-[11px] text-gray-400">Be specific: mention parties, budget, duration, deliverables</p>
                            <button
                                onClick={handleGenerate}
                                disabled={streaming || !prompt.trim()}
                                className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-violet-600 hover:bg-violet-700 disabled:opacity-60 disabled:cursor-not-allowed rounded-xl shadow-md shadow-violet-200 transition-all"
                            >
                                {streaming
                                    ? <><Loader2 size={14} className="animate-spin" /> Generating…</>
                                    : <><Sparkles size={14} /> Generate Contract</>
                                }
                            </button>
                        </div>
                    </div>

                    {/* Output area */}
                    {(generatedText || streaming) && (
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <FileText size={14} className="text-gray-500" />
                                    <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Generated Contract</span>
                                    {streaming && (
                                        <span className="flex items-center gap-1 text-[10px] text-violet-600 font-semibold bg-violet-50 px-2 py-0.5 rounded-full">
                                            <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse"></span>
                                            Live
                                        </span>
                                    )}
                                </div>
                                {generatedText && !streaming && (
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={handleCopy}
                                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                                        >
                                            {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                                            {copied ? 'Copied!' : 'Copy'}
                                        </button>
                                    </div>
                                )}
                            </div>
                            <div
                                ref={outputRef}
                                className="bg-gray-50 rounded-xl border border-gray-100 p-5 max-h-[40vh] overflow-y-auto"
                            >
                                <pre className="text-xs text-gray-800 leading-relaxed whitespace-pre-wrap font-mono">
                                    {generatedText}
                                    {streaming && <span className="inline-block w-0.5 h-3.5 bg-violet-500 ml-0.5 animate-pulse align-middle" />}
                                </pre>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                {generatedText && !streaming && (
                    <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50 flex-shrink-0">
                        <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors">
                            Discard
                        </button>
                        <button
                            onClick={handleSave}
                            className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-violet-600 hover:bg-violet-700 rounded-xl shadow-md shadow-violet-200 transition-all"
                        >
                            <FileText size={14} /> Save as Contract
                        </button>
                    </div>
                )}
            </motion.div>
        </div>
    );
};

export default AIDraftModal;
