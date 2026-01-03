import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    
    const navigate = useNavigate();
    const { login } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const result = await login(username, password);

        if (result.success) {
            navigate('/');
        } else {
            setError(result.message);
        }

        setLoading(false);
    };

    return (
        <div className="min-h-screen flex justify-center items-center bg-gradient-to-br from-[#1e3c72] to-[#2a5298] font-sans">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-[420px] overflow-hidden m-5 sm:m-0">
                <div className="bg-gradient-to-br from-[#2c3e50] to-[#34495e] text-white p-10 text-center">
                    <h1 className="m-0 text-4xl font-bold tracking-widest">VMUT</h1>
                </div>

                <form onSubmit={handleSubmit} className="p-10">
                    <h2 className="mb-8 text-[#2c3e50] text-2xl text-center font-semibold">Connexion</h2>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-md mb-5 flex items-center gap-2.5 text-sm">
                            <span className="text-lg">⚠️</span> {error}
                        </div>
                    )}

                    <div className="mb-6">
                        <label htmlFor="username" className="block mb-2 text-gray-600 font-medium text-sm">Nom d'utilisateur</label>
                        <input
                            id="username"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Entrez votre nom d'utilisateur"
                            required
                            autoFocus
                            disabled={loading}
                            className="w-full p-3 border-2 border-gray-200 rounded-md text-[15px] transition-all duration-300 focus:outline-none focus:border-[#2c3e50] focus:ring-4 focus:ring-[#2c3e50]/10 disabled:bg-gray-100 disabled:cursor-not-allowed"
                        />
                    </div>

                    <div className="mb-6">
                        <label htmlFor="password" className="block mb-2 text-gray-600 font-medium text-sm">Mot de passe</label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Entrez votre mot de passe"
                            required
                            disabled={loading}
                            className="w-full p-3 border-2 border-gray-200 rounded-md text-[15px] transition-all duration-300 focus:outline-none focus:border-[#2c3e50] focus:ring-4 focus:ring-[#2c3e50]/10 disabled:bg-gray-100 disabled:cursor-not-allowed"
                        />
                    </div>

                    <button 
                        type="submit" 
                        className="w-full p-3.5 bg-gradient-to-br from-[#2c3e50] to-[#34495e] text-white border-none rounded-md text-base font-semibold cursor-pointer transition-all duration-300 mt-2.5 hover:not-disabled:bg-gradient-to-br hover:not-disabled:from-[#34495e] hover:not-disabled:to-[#2c3e50] hover:not-disabled:-translate-y-0.5 hover:not-disabled:shadow-lg active:not-disabled:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed"
                        disabled={loading}
                    >
                        {loading ? 'Connexion...' : 'Se connecter'}
                    </button>
                </form>

                <div className="bg-gray-50 p-5 text-center border-t border-gray-200">
                    <p className="m-0 text-gray-500 text-[13px]">© 2025 MBDA - Tous droits réservés</p>
                </div>
            </div>
        </div>
    );
};

export default Login;
