import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { Button } from '../components/ui/Button';
import SEO from '../components/SEO';

export default function ChangePassword() {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmation, setConfirmation] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);

    const submit = async (event) => {
        event.preventDefault();
        setError('');
        setMessage('');
        if (newPassword !== confirmation) return setError('New passwords do not match.');
        setSaving(true);
        try {
            const result = await api.auth.changePassword(currentPassword, newPassword);
            setMessage(result.message || 'Password changed successfully.');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmation('');
        } catch (err) {
            setError(err.message || 'Could not change password.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <main className="min-h-screen bg-gray-50 px-4 py-24">
            <SEO title="Change Password - Africa Konnect" />
            <div className="mx-auto max-w-md rounded-2xl bg-white p-8 shadow-sm">
                <h1 className="mb-2 text-2xl font-bold">Change password</h1>
                <p className="mb-6 text-sm text-gray-600">Your current password is required. Other sessions will be signed out.</p>
                {error && <p role="alert" className="mb-4 text-sm text-red-700">{error}</p>}
                {message && <p role="status" className="mb-4 text-sm text-green-700">{message}</p>}
                <form onSubmit={submit} className="space-y-4">
                    <label className="block text-sm font-medium">Current password
                        <input type="password" autoComplete="current-password" required value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className="mt-1 w-full rounded-lg border p-3" />
                    </label>
                    <label className="block text-sm font-medium">New password
                        <input type="password" autoComplete="new-password" required minLength={8} value={newPassword} onChange={e => setNewPassword(e.target.value)} className="mt-1 w-full rounded-lg border p-3" />
                    </label>
                    <p className="text-xs text-gray-500">At least 8 characters, including uppercase and lowercase letters, a number and a special character.</p>
                    <label className="block text-sm font-medium">Confirm new password
                        <input type="password" autoComplete="new-password" required value={confirmation} onChange={e => setConfirmation(e.target.value)} className="mt-1 w-full rounded-lg border p-3" />
                    </label>
                    <Button type="submit" disabled={saving} className="w-full">{saving ? 'Saving…' : 'Change password'}</Button>
                </form>
                <Link to="/profile" className="mt-5 block text-center text-sm text-primary">Back to profile</Link>
            </div>
        </main>
    );
}
