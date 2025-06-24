import { useState } from 'react';
import { register, login } from './api';
import { useNavigate } from 'react-router-dom';

export default function AuthForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      if (isLogin) {
        const res = await login(email, password);
        setSuccess('Login successful!');
        localStorage.setItem('token', res.data.access_token);
        setTimeout(() => navigate('/dashboard'), 500); // redirect after login
      } else {
        await register(email, password, fullName);
        setSuccess('Registration successful! You can now log in.');
        setIsLogin(true);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-100 to-purple-200 transition-all">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-lg w-full max-w-sm animate-fade-in">
        <h2 className="text-2xl font-bold mb-6 text-center text-purple-700 transition-all">
          {isLogin ? 'Sign In' : 'Create Account'}
        </h2>
        {!isLogin && (
          <input
            type="text"
            placeholder="Full Name"
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            className="mb-3 w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all"
            required
          />
        )}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="mb-3 w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="mb-6 w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all"
          required
        />
        <button
          type="submit"
          className="w-full py-2 px-4 bg-gradient-to-r from-purple-500 to-blue-400 text-white font-semibold rounded shadow hover:scale-105 transition-transform duration-200"
          disabled={loading}
        >
          {loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Register'}
        </button>
        <div className="mt-4 text-center">
          <button
            type="button"
            className="text-purple-600 hover:underline text-sm"
            onClick={() => { setIsLogin(!isLogin); setError(''); setSuccess(''); }}
          >
            {isLogin ? "Don't have an account? Create one" : 'Already have an account? Sign in'}
          </button>
        </div>
        {error && <div className="mt-4 text-red-500 text-center animate-shake">{error}</div>}
        {success && <div className="mt-4 text-green-600 text-center animate-fade-in">{success}</div>}
      </form>
    </div>
  );
}
