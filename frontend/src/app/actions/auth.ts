'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { API_URL } from '../services/api'

export async function loginAction(formData: FormData) {
  const username = formData.get('username')
  const password = formData.get('password')

  if (!username || !password) {
    return { error: 'Username and password are required' }
  }

  try {
    const res = await fetch(`${API_URL}/token/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })

    if (!res.ok) {
      return { error: 'Invalid credentials' }
    }

    const responseJson = await res.json()
    
    // The backend now wraps all responses in { success: true, data: {...} }
    const accessToken = responseJson.data?.access || responseJson.access;

    if (!accessToken) {
      return { error: 'Invalid token structure from server' }
    }

    // Set httpOnly cookie
    const cookieStore = await cookies()
    cookieStore.set('jwt', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 // 1 day
    })

  } catch (err) {
    return { error: 'Failed to connect to server' }
  }
  
  redirect('/')
}

export async function logoutAction() {
  const cookieStore = await cookies()
  cookieStore.delete('jwt')
  redirect('/login')
}
