'use client';
import { useState } from 'react';
import { supabase } from '../lib/supabase';
export default function AccountPanel({ session, onClose, language, profiles = [], activeProfile, onSelectProfile, onCreateProfile }) {
    const ar = language === 'ar';
    const [mode, setMode] = useState('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState('');
    const [profileName, setProfileName] = useState('');
    async function submit(e) {
        e.preventDefault();
        setBusy(true);
        setMessage('');
        try {
            const { error } = mode === 'register'
                ? await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } })
                : await supabase.auth.signInWithPassword({ email, password });
            if (error) throw error;
            setMessage(mode === 'register' ? (ar ? 'تم التسجيل. تحقق من بريدك إذا طُلب التأكيد.' : 'Registered. Check your email if verification is required.') : '');
            if (mode === 'login') onClose();
        } catch (e) {
            setMessage(e.message || 'Authentication failed');
        } finally { setBusy(false); }
    }
    return <div className="account-overlay" role="dialog" aria-modal="true" aria-label={ar ? 'الحساب' : 'Account'} onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
        <div className="account-panel" dir={ar ? 'rtl' : 'ltr'}>
            <button className="account-close" onClick={onClose} aria-label="Close">×</button>
            <h2>{ar ? 'الحساب' : 'Your account'}</h2>
            {session ? <>
                <p className="account-email">{session.user.email}</p>
                <p>{ar ? 'يمكن مزامنة قائمتك وسجل المشاهدة عبر الأجهزة.' : 'Your list and viewing history can sync across devices.'}</p>
                <h3>{ar ? 'ملفات العائلة' : 'Family profiles'}</h3>
                <div className="profile-list">{profiles.map(profile => <button type="button" key={profile.id} onClick={() => { onSelectProfile(profile.id); onClose(); }} className={'profile-choice '+(activeProfile?.id===profile.id?'chosen':'')}>{profile.name} {activeProfile?.id===profile.id?'✓':''}</button>)}</div>
                <form className="profile-create" onSubmit={async e => { e.preventDefault(); if(!profileName.trim())return;setBusy(true);setMessage('');try{await onCreateProfile(profileName.trim());setProfileName('');}catch(err){setMessage(err.message||'Could not create profile');}finally{setBusy(false);}}}>
                    <input maxLength={30} placeholder={ar?'اسم الملف الجديد':'New profile name'} value={profileName} onChange={e=>setProfileName(e.target.value)} required/>
                    <button disabled={busy||profiles.length>=8} type="submit">{ar?'إضافة':'Add profile'}</button>
                </form>
                <p className="account-message">{ar?'حتى 8 ملفات لكل حساب':'Up to 8 profiles per account'}</p>
                <button className="primary account-submit" onClick={async () => { await supabase.auth.signOut(); onClose(); }}>{ar ? 'تسجيل خروج' : 'Sign out'}</button>
            </> : <>
                <div className="account-tabs"><button className={mode === 'login' ? 'active' : ''} onClick={() => { setMode('login'); setMessage(''); }}>{ar ? 'دخول' : 'Sign in'}</button><button className={mode === 'register' ? 'active' : ''} onClick={() => { setMode('register'); setMessage(''); }}>{ar ? 'حساب جديد' : 'Create account'}</button></div>
                <form onSubmit={submit} className="account-form">
                    <label>{ar ? 'البريد الإلكتروني' : 'Email'}<input type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} /></label>
                    <label>{ar ? 'كلمة المرور' : 'Password'}<input type="password" minLength={6} required autoComplete={mode === 'register' ? 'new-password' : 'current-password'} value={password} onChange={e => setPassword(e.target.value)} /></label>
                    <button className="primary account-submit" type="submit" disabled={busy}>{busy ? '...' : mode === 'register' ? (ar ? 'إنشاء حساب' : 'Create account') : (ar ? 'تسجيل الدخول' : 'Sign in')}</button>
                </form>
                {message && <p className="account-message" role="status">{message}</p>}
            </>}
        </div>
    </div>;
}
