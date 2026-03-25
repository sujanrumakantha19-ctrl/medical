'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

const slides = [
  {
    image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=1200&h=800&fit=crop',
    icon: 'health_and_safety',
    title: 'A Sophisticated Sanctuary for Care.',
    description: 'Welcome back to the Sanctuary Health portal. Your dedication ensures every patient finds tranquility and clinical excellence.',
    badge: 'EST. 2024 | SECURE RECEPTION NODE',
  },
  {
    image: 'https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=1200&h=800&fit=crop',
    icon: 'local_hospital',
    title: 'Excellence in Healthcare Management.',
    description: 'Streamline your hospital operations with our comprehensive management system designed for modern medical facilities.',
    badge: 'TRUSTED BY 500+ HOSPITALS',
  },
  {
    image: 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=1200&h=800&fit=crop',
    icon: 'monitoring',
    title: 'Real-Time Analytics & Insights.',
    description: 'Make data-driven decisions with our advanced analytics dashboard providing real-time hospital performance metrics.',
    badge: 'ADVANCED ANALYTICS',
  },
  {
    image: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=1200&h=800&fit=crop',
    icon: 'security',
    title: 'Enterprise-Grade Security.',
    description: 'Your patient data is protected with end-to-end encryption and compliance with healthcare regulations.',
    badge: 'HIPAA COMPLIANT | SOC 2',
  },
];

function Carousel() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  }, []);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  }, []);

  useEffect(() => {
    const interval = setInterval(nextSlide, 5000);
    return () => clearInterval(interval);
  }, [nextSlide]);

  return (
    <div className="relative w-full h-full overflow-hidden">
      {slides.map((slide, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
          }`}
        >
          <img
            src={slide.image}
            alt={`Slide ${index + 1}`}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/70 via-blue-800/50 to-blue-900/70" />
        </div>
      ))}

      <div className="absolute inset-0 z-20 flex flex-col justify-center px-12 lg:px-16 text-white">
        <div className="mb-6 animate-fadeIn">
          <span className="material-symbols-outlined text-5xl lg:text-6xl" style={{ fontVariationSettings: "'FILL' 1" }}>
            {slides[currentSlide].icon}
          </span>
        </div>
        <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight mb-4 animate-slideUp">
          {slides[currentSlide].title}
        </h1>
        <p className="text-lg font-light leading-relaxed text-white/90 max-w-lg animate-slideUp">
          {slides[currentSlide].description}
        </p>
        
        <div className="mt-12 lg:mt-16">
          <div className="flex gap-3 mb-8">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  index === currentSlide 
                    ? 'w-12 bg-white' 
                    : 'w-4 bg-white/30 hover:bg-white/50'
                }`}
              />
            ))}
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={prevSlide}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-all"
            >
              <span className="material-symbols-outlined">chevron_left</span>
            </button>
            <button
              onClick={nextSlide}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-all"
            >
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      <div className="absolute bottom-8 left-12 lg:left-16 z-20">
        <p className="text-xs lg:text-sm font-medium text-white/60 tracking-widest uppercase">
          {slides[currentSlide].badge}
        </p>
      </div>

      <div className="absolute top-6 right-6 z-20 flex items-center gap-2 text-white/60">
        <span className="material-symbols-outlined text-xl">wifi</span>
        <span className="text-xs font-medium">LIVE</span>
      </div>
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    keepSignedIn: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Login failed');
        setIsLoading(false);
        return;
      }

      // Store user info in localStorage
      localStorage.setItem('user', JSON.stringify(data.user));

      // Redirect based on role
      if (data.user.role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/staff');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <main className="flex h-screen w-screen overflow-hidden bg-white">
      <aside className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center bg-blue-900">
        <Carousel />
      </aside>

      <section className="w-full lg:w-1/2 flex flex-col items-center justify-center px-6 lg:px-12 xl:px-24 bg-white overflow-y-auto">
        <div className="w-full max-w-md py-8">
          <header className="mb-8">
            <div className="flex items-center gap-3 mb-6">
              <span className="material-symbols-outlined text-blue-600 text-2xl lg:text-3xl">
                shield_with_heart
              </span>
              <span className="text-xl lg:text-2xl font-bold tracking-tight text-blue-900">
                Sanctuary Health
              </span>
            </div>
            <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 tracking-tight mb-2">
              Staff Login
            </h2>
            <p className="text-gray-500 font-medium text-sm lg:text-base">
              Please enter your credentials to access the portal.
            </p>
          </header>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-600 text-sm">
              <span className="material-symbols-outlined text-sm">error</span>
              {error}
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 tracking-wide">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                  <span className="material-symbols-outlined text-[20px]">mail</span>
                </div>
                <input
                  className="block w-full pl-11 pr-4 py-3.5 bg-gray-100 border-none rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all duration-200 outline-none"
                  placeholder="you@example.com"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-semibold text-gray-700 tracking-wide">
                  Password
                </label>
                <a
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors"
                  href="#"
                >
                  Forgot Password?
                </a>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                  <span className="material-symbols-outlined text-[20px]">lock</span>
                </div>
                <input
                  className="block w-full pl-11 pr-12 py-3.5 bg-gray-100 border-none rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all duration-200 outline-none"
                  placeholder="Enter your password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  required
                />
                <button
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            <div className="flex items-center">
              <input
                className="w-5 h-5 rounded text-blue-600 border-gray-300 bg-white focus:ring-blue-500 cursor-pointer"
                id="keep-signed-in"
                type="checkbox"
                checked={formData.keepSignedIn}
                onChange={(e) =>
                  setFormData({ ...formData, keepSignedIn: e.target.checked })
                }
              />
              <label
                className="ml-3 text-sm font-medium text-gray-600 select-none cursor-pointer"
                htmlFor="keep-signed-in"
              >
                Keep me signed in for 7 days
              </label>
            </div>

            <button
              className="w-full py-3.5 lg:py-4 px-6 bg-gradient-to-r from-blue-800 to-blue-600 text-white font-bold rounded-lg shadow-lg hover:shadow-xl active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="material-symbols-outlined animate-spin">progress_activity</span>
              ) : (
                <>
                  <span>Sign In</span>
                  <span className="material-symbols-outlined text-[18px]">login</span>
                </>
              )}
            </button>
          </form>

          <footer className="mt-8 lg:mt-12 flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-gray-200">
            <div className="flex items-center gap-2 text-gray-500">
              <span className="material-symbols-outlined text-[18px]">verified_user</span>
              <span className="text-xs font-medium tracking-wide">End-to-End Encrypted</span>
            </div>
            <a
              className="flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-blue-600 transition-colors"
              href="#"
            >
              <span className="material-symbols-outlined text-[18px]">contact_support</span>
              Contact IT Support
            </a>
          </footer>

          <div className="mt-6 text-center text-[10px] text-gray-400 uppercase tracking-[0.2em]">
            © 2026 Sanctuary Health Systems. All rights reserved.
          </div>
        </div>
      </section>
    </main>
  );
}
