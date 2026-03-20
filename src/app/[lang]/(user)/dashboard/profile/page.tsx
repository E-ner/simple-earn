'use client'

import { signOut } from "next-auth/react"
import { motion, AnimatePresence } from 'framer-motion'
import { updateProfile, updatePassword, deleteAccount } from '@/app/actions/userActions'
import { useToast } from '@/context/ToastContext'
import { User, Shield, Key, Mail, Edit3, Loader2, Trash2, AlertTriangle } from 'lucide-react'
import { useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { getDictionary, Locale } from "@/lib/dictionary"

export default function ProfilePage() {
  const { lang } = useParams()
  const { showToast } = useToast()
  const [dict, setDict] = useState<any>(null)

  // Profile Form State
  const [profileData, setProfileData] = useState({ username: '', email: '', phone: '', country: 'US', language: 'en' })
  const [profileLoading, setProfileLoading] = useState(false)
  const [fetching, setFetching] = useState(true)

  // Password Form State
  const [passwordData, setPasswordData] = useState({ current: '', next: '', confirm: '' })
  const [passwordLoading, setPasswordLoading] = useState(false)

  // Account Deletion State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  useEffect(() => {
    async function loadResources() {
      try {
        const [dictionary, res] = await Promise.all([
          getDictionary(lang as Locale),
          fetch('/api/user/profile').then(r => r.json())
        ])
        setDict(dictionary)
        if (res.user) {
          setProfileData({
            username: res.user.username || '',
            email: res.user.email || '',
            phone: res.user.phone || '',
            country: res.user.country || 'US',
            language: res.user.language || 'en'
          })
        }
      } catch (err) {
        console.error('Failed to load profile resources:', err)
      } finally {
        setFetching(false)
      }
    }
    loadResources()
  }, [lang])

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setProfileLoading(true)
    try {
      await updateProfile(profileData)
      showToast('Node Credentials Synchronized', 'SUCCESS')
    } catch (err: any) {
      showToast(err.message || 'Synchronization Failure', 'ERROR')
    } finally {
      setProfileLoading(false)
    }
  }

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (passwordData.next !== passwordData.confirm) {
      showToast('Cryptographic Mismatch: Passwords do not match', 'ERROR')
      return
    }
    setPasswordLoading(true)
    try {
      await updatePassword(passwordData.current, passwordData.next)
      showToast('Security Protocol Updated', 'SUCCESS')
      setPasswordData({ current: '', next: '', confirm: '' })
    } catch (err: any) {
      showToast(err.message || 'Protocol Update Failed', 'ERROR')
    } finally {
      setPasswordLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    setDeleteLoading(true)
    try {
      await deleteAccount()
      showToast('Account Termination Protocol Executed', 'SUCCESS')
      signOut({ callbackUrl: `/${lang}/login` as any })
    } catch (err: any) {
      showToast(err.message || 'Termination Protocol Failed', 'ERROR')
      setDeleteLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-10 pb-20">
      <header className="mb-2 space-y-2">
        <h1 className="text-3xl font-bold text-[var(--text-primary)] tracking-tight">
          {dict?.common?.profile || 'Node Configuration'}
        </h1>
        <p className="text-[var(--text-tertiary)] max-w-2xl leading-relaxed uppercase font-black text-[10px] tracking-widest italic">
          Manage your institutional identity and cryptographic security protocols.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Profile Section */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="p-8 rounded-md bg-[var(--surface)] border border-[var(--border)] space-y-8"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-sm bg-[var(--accent)]/10 text-[var(--accent)]">
              <User className="w-5 h-5" />
            </div>
            <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--text-primary)]">Identity Parameters</h2>
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase tracking-widest text-[var(--text-tertiary)]">Authorized Username</label>
              <div className="relative">
                <input
                  type="text"
                  value={profileData.username}
                  onChange={(e) => setProfileData({ ...profileData, username: e.target.value })}
                  className="w-full h-11 bg-[var(--surface-2)] border border-[var(--border)] rounded-md px-4 text-sm text-[var(--text-primary)] focus:border-[var(--accent)] outline-none transition-colors pl-10"
                  placeholder="New identification handle..."
                />
                <Edit3 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#444]" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase tracking-widest text-[#555]">Communication Channel (Email)</label>
              <div className="relative">
                <input
                  type="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                  className="w-full h-11 bg-[var(--surface-2)] border border-[var(--border)] rounded-md px-4 text-sm text-[var(--text-primary)] focus:border-[var(--accent)] outline-none transition-colors pl-10"
                  placeholder="Official contact vector..."
                />
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#444]" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-widest text-[#555]">Relay Frequency (Phone)</label>
                <input
                  type="text"
                  value={profileData.phone}
                  onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  className="w-full h-11 bg-[var(--surface-2)] border border-[var(--border)] rounded-md px-4 text-sm text-[var(--text-primary)] focus:border-[var(--accent)] outline-none transition-colors"
                  placeholder="+1..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-widest text-[#555]">Geographic Node (Country)</label>
                <input
                  type="text"
                  value={profileData.country}
                  onChange={(e) => setProfileData({ ...profileData, country: e.target.value })}
                  className="w-full h-11 bg-[var(--surface-2)] border border-[var(--border)] rounded-md px-4 text-sm text-[var(--text-primary)] focus:border-[var(--accent)] outline-none transition-colors"
                  placeholder="US, FR, etc."
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase tracking-widest text-[#555]">Protocol Language</label>
              <select
                value={profileData.language}
                onChange={(e) => setProfileData({ ...profileData, language: e.target.value })}
                className="w-full h-11 bg-[#16161f] border border-white/[0.08] rounded-md px-4 text-sm text-white focus:border-[var(--accent)] outline-none transition-colors"
              >
                <option value="en">English (Precision)</option>
                <option value="fr">French (Elegance)</option>
                <option value="rw">Kinyarwanda (Local)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={profileLoading}
              className="w-full h-11 rounded-md bg-[var(--text-primary)] text-[var(--bg-elevated)] text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            >
              {profileLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Commit Changes'}
            </button>
          </form>
        </motion.div>

        {/* Security Section */}
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          className="p-8 rounded-md bg-[var(--surface)] border border-[var(--border)] space-y-8"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-sm bg-red-500/10 text-red-500">
              <Shield className="w-5 h-5" />
            </div>
            <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--text-primary)]">Security Key Management</h2>
          </div>

          <form onSubmit={handleUpdatePassword} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase tracking-widest text-[#555]">Current Cryptographic Key</label>
              <div className="relative">
                <input
                  type="password"
                  value={passwordData.current}
                  onChange={(e) => setPasswordData({ ...passwordData, current: e.target.value })}
                  className="w-full h-11 bg-[var(--surface-2)] border border-[var(--border)] rounded-md px-4 text-sm text-[var(--text-primary)] focus:border-[var(--accent)] outline-none transition-colors pl-10"
                />
                <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#444]" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase tracking-widest text-[#555]">Target Security Key</label>
              <input
                type="password"
                value={passwordData.next}
                onChange={(e) => setPasswordData({ ...passwordData, next: e.target.value })}
                className="w-full h-11 bg-[var(--surface-2)] border border-[var(--border)] rounded-md px-4 text-sm text-[var(--text-primary)] focus:border-[var(--accent)] outline-none transition-colors"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase tracking-widest text-[#555]">Verify Target Key</label>
              <input
                type="password"
                value={passwordData.confirm}
                onChange={(e) => setPasswordData({ ...passwordData, confirm: e.target.value })}
                className="w-full h-11 bg-white/[0.03] border border-white/[0.08] rounded-md px-4 text-sm text-white focus:border-[var(--accent)] outline-none transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={passwordLoading}
              className="w-full h-11 rounded-md bg-red-500 text-white text-[10px] font-black uppercase tracking-widest hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
            >
              {passwordLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Update Protocol'}
            </button>
          </form>
        </motion.div>
      </div>

      {/* Account Termination Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-8 rounded-md bg-[var(--surface)] border border-red-500/10 space-y-6"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-sm bg-red-500/10 text-red-500">
            <Trash2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-red-500">Account Termination Protocol</h2>
            <p className="text-[9px] text-[var(--text-tertiary)] uppercase font-bold tracking-widest mt-1">High-Risk Operation: Irreversible network exit.</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 p-6 rounded-md bg-red-500/[0.03] border border-red-500/10">
          <div className="space-y-1">
            <h3 className="text-xs font-bold text-[var(--text-primary)] uppercase italic">Data Purge Warning</h3>
            <p className="text-[10px] text-[var(--text-secondary)] max-w-md">
              Executing this protocol will permanently erase your verified identity, cognitive yield history, and all institutional credentials. This action cannot be undone.
            </p>
          </div>
          <button
            onClick={() => setIsDeleteModalOpen(true)}
            className="px-6 h-10 rounded-md border border-red-500/30 text-red-500 text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all whitespace-nowrap"
          >
            Initiate Termination
          </button>
        </div>
      </motion.div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {isDeleteModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-[var(--bg-elevated)] border border-[var(--border)] p-8 rounded-md space-y-6 shadow-2xl shadow-red-500/10"
            >
              <div className="flex flex-col items-center text-center gap-4">
                <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center text-red-500 border border-red-500/20">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-sm font-black uppercase tracking-widest text-[var(--text-primary)]">Confirm Data Purge?</h3>
                  <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wide">Enter the institutional code below to confirm account termination.</p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-center text-[9px] font-mono text-[var(--text-tertiary)] uppercase">Verification Code: <span className="text-[var(--text-primary)] font-bold select-all">TERMINATE-PURGE-DATA</span></p>
                <input
                  type="text"
                  placeholder="Type verification code..."
                  id="termination-confirm"
                  className="w-full h-11 bg-[var(--surface-2)] border border-[var(--border)] rounded-md px-4 text-center text-sm text-[var(--text-primary)] focus:border-red-500 outline-none transition-colors"
                  onChange={(e) => {
                    if (e.target.value === 'TERMINATE-PURGE-DATA') {
                      (e.target as any).dataset.confirmed = 'true'
                    } else {
                      (e.target as any).dataset.confirmed = 'false'
                    }
                  }}
                />
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="flex-1 h-11 rounded-md bg-white/[0.03] border border-white/[0.08] text-[10px] font-black uppercase tracking-widest text-white hover:bg-white/[0.06] transition-colors"
                >
                  Abort Protocol
                </button>
                <button
                  onClick={() => {
                    const input = document.getElementById('termination-confirm') as HTMLInputElement
                    if (input.value === 'TERMINATE-PURGE-DATA') {
                      handleDeleteAccount()
                    } else {
                      showToast('Protocol Mismatch: Incorrect verification code', 'ERROR')
                    }
                  }}
                  disabled={deleteLoading}
                  className="flex-1 h-11 rounded-md bg-red-500 text-white text-[10px] font-black uppercase tracking-widest hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
                >
                  {deleteLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Purge'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
