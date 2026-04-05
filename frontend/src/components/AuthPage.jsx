import React, { useState } from 'react';
import { login, signup } from '../services/api';

export default function AuthPage({ onAuthSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in all required fields.');
      return;
    }

    if (!isLogin && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (!isLogin && password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        const data = await login(email.trim(), password);
        onAuthSuccess(data);
      } else {
        const data = await signup(email.trim(), password);
        onAuthSuccess(data);
      }
    } catch (err) {
      setError(err.message || (isLogin ? 'Login failed' : 'Registration failed'));
    } finally {
      setLoading(false);
    }
  };

  const GoogleIcon = () => (
    <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="glass w-full max-w-md rounded-[2.5rem] p-8 md:p-10 animate-scaleUp shadow-glass hover:shadow-glass-hover">
        <div className="mb-8 text-center">
          <h1 className="font-heading text-3xl font-bold mb-3 text-ink">
            {isLogin ? 'Welcome back' : 'Create an account'}
          </h1>
          <p className="text-ink/60 text-sm">
            {isLogin ? 'Sign in to access your Pneuma space' : 'Start your mental wellness journey today.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="flex gap-4 animate-slideIn" style={{ animationDelay: '0.1s' }}>
              <div className="flex-1">
                <label className="block text-sm font-semibold mb-1.5 text-ink/80">First name</label>
                <input
                  type="text"
                  placeholder="Priya"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-ink/10 bg-surface/50 text-ink outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all placeholder:text-ink/30"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-semibold mb-1.5 text-ink/80">Last name</label>
                <input
                  type="text"
                  placeholder="Sharma"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-ink/10 bg-surface/50 text-ink outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all placeholder:text-ink/30"
                />
              </div>
            </div>
          )}

          <div className="animate-slideIn" style={{ animationDelay: isLogin ? '0.1s' : '0.2s' }}>
            <label className="block text-sm font-semibold mb-1.5 text-ink/80">Email address</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-ink/10 bg-surface/50 text-ink outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all placeholder:text-ink/30"
              required
            />
          </div>

          <div className="animate-slideIn" style={{ animationDelay: isLogin ? '0.2s' : '0.3s' }}>
            <label className="block text-sm font-semibold mb-1.5 text-ink/80">Password</label>
            <input
              type="password"
              placeholder={isLogin ? "••••••••" : "Min. 8 characters"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-ink/10 bg-surface/50 text-ink outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all placeholder:text-ink/30"
              required
            />
          </div>

          {!isLogin && (
            <div className="animate-slideIn" style={{ animationDelay: '0.4s' }}>
              <label className="block text-sm font-semibold mb-1.5 text-ink/80">Confirm password</label>
              <input
                type="password"
                placeholder="Re-enter password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-ink/10 bg-surface/50 text-ink outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all placeholder:text-ink/30"
                required={!isLogin}
              />
            </div>
          )}

          {error && (
            <div className="text-roseleaf text-sm font-medium mt-2 p-3 bg-roseleaf/10 rounded-xl border border-roseleaf/20 animate-rise">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 mt-4 rounded-xl font-bold transition-all bg-accent text-white hover:bg-accent/90 hover:shadow-lg hover:shadow-accent/30 active:scale-95 animate-slideIn"
            style={{ animationDelay: isLogin ? '0.3s' : '0.5s' }}
          >
            {loading ? 'Processing...' : (isLogin ? 'Sign in' : 'Create account')}
          </button>
        </form>

        <div className="mt-8 flex items-center justify-between opacity-50">
          <hr className="flex-1 border-t border-ink/20" />
          <span className="px-4 text-sm font-medium text-ink">or</span>
          <hr className="flex-1 border-t border-ink/20" />
        </div>

        <button
          type="button"
          onClick={() => setError("Google authentication coming soon")}
          className="mt-8 w-full flex items-center justify-center py-3 rounded-xl font-semibold transition-all border border-ink/10 bg-surface/50 text-ink/80 hover:bg-surface hover:text-ink hover:shadow-md active:scale-95"
        >
          <GoogleIcon />
          Continue with Google
        </button>

        {!isLogin && (
          <p className="text-center text-xs text-ink/50 mt-6 font-medium">
            By creating an account you agree to our <a href="#" className="text-accent hover:underline">Terms</a> and <a href="#" className="text-accent hover:underline">Privacy Policy</a>
          </p>
        )}

        <div className="mt-8 text-center text-sm font-medium border-t border-ink/10 pt-6">
          {isLogin ? (
            <p className="text-ink/60">
              No account? <button onClick={() => { setIsLogin(false); setError(''); }} className="text-accent hover:underline ml-1">Create one free</button>
            </p>
          ) : (
            <p className="text-ink/60">
              Already have an account? <button onClick={() => { setIsLogin(true); setError(''); }} className="text-accent hover:underline ml-1">Sign in</button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}