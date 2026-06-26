'use client'

import { useActionState } from 'react'
import { loginAction } from '../actions/auth'
import { Terminal } from 'lucide-react'

export default function LoginPage() {
  const [state, action, isPending] = useActionState(
    async (prevState: any, formData: FormData) => {
      return await loginAction(formData)
    },
    { error: '' }
  )

  return (
    <div className="min-h-screen flex items-center justify-center bg-background font-sans text-text-primary selection:bg-primary selection:text-text-primary">
      <div className="card p-8 w-full max-w-md bg-surface border-border shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]">
        <div className="flex flex-col items-center mb-8 pb-6 border-b border-border">
          <div className="w-16 h-16 border-2 border-text-primary bg-primary flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(17,24,39,1)] mb-4">
            <Terminal className="text-text-primary w-8 h-8" />
          </div>
          <h1 className="text-3xl font-serif font-bold tracking-tight">NeuronOps_</h1>
          <p className="font-mono text-xs text-text-secondary uppercase mt-2 tracking-widest">SYS.AUTH.PORTAL</p>
        </div>

        <form action={action} className="space-y-6">
          {state?.error && (
            <div className="p-3 text-xs font-mono font-bold text-background bg-text-primary uppercase border border-text-primary">
              ERROR: {state.error}
            </div>
          )}
          
          <div>
            <label className="block text-xs font-mono uppercase font-bold mb-2">Username_</label>
            <input 
              name="username" 
              className="w-full bg-background border border-border py-2 px-3 text-sm focus:outline-none focus:border-text-primary transition-colors font-mono"
            />
          </div>
          
          <div>
            <label className="block text-xs font-mono uppercase font-bold mb-2">Password_</label>
            <input 
              type="password" 
              name="password" 
              className="w-full bg-background border border-border py-2 px-3 text-sm focus:outline-none focus:border-text-primary transition-colors font-mono"
            />
          </div>
          
          <button 
            type="submit" 
            disabled={isPending}
            className="w-full bg-text-primary text-background font-bold py-3 px-4 uppercase font-mono text-sm hover:opacity-90 transition-opacity disabled:opacity-50 border border-text-primary shadow-[2px_2px_0px_0px_rgba(255,154,158,1)]"
          >
            {isPending ? 'AUTHENTICATING...' : 'EXEC_LOGIN'}
          </button>
        </form>
      </div>
    </div>
  )
}
