import React from 'react';
import { ArrowLeft, Check, Menu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Privacy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 flex items-center gap-3 px-4 py-3 border-b border-white/5 bg-[#0B0D1F]/60 backdrop-blur-md mb-2">
        <button 
          onClick={() => window.dispatchEvent(new CustomEvent('lumatha_mobile_sidebar_toggle'))} 
          className="w-10 h-10 flex items-center justify-center rounded-xl transition-transform active:scale-90 hover:bg-white/5"
        >
          <Menu className="w-6 h-6 text-blue-500" strokeWidth={2} />
        </button>
        
        <div className="flex flex-col flex-1 min-w-0">
          <p className="text-base font-black tracking-wide text-blue-600 leading-none">LUMATHA</p>
          <h2 className="text-xs font-bold text-muted-foreground mt-1 uppercase tracking-widest">Privacy Policy</h2>
        </div>

        <button onClick={() => navigate(-1)} className="text-xs text-muted-foreground hover:text-white">
          Back
        </button>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="prose prose-sm dark:prose-invert max-w-none space-y-6">
          <div>
            <p className="text-xs text-muted-foreground mb-4">Last updated: December 25, 2082</p>
            <p className="text-sm text-muted-foreground mb-4">Governed by the laws of Nepal</p>
          </div>

          <section>
            <h2 className="text-xl font-semibold mb-3">1. Information We Collect</h2>
            <p className="text-muted-foreground mb-3">
              We collect information to provide better services to all our users. The types of information we collect include:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>Account Information: Name, email address, and profile details.</li>
              <li>Content You Create: Posts, photos, and messages you share on the platform.</li>
              <li>Usage Data: Information about how you interact with our services.</li>
              <li>Device Information: IP address, device type, and operating system.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">2. How We Use Information</h2>
            <p className="text-muted-foreground mb-3">
              We use the information we collect for the following purposes:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>To provide, maintain, and improve our services.</li>
              <li>To personalize your experience and provide relevant content.</li>
              <li>To communicate with you about updates and security.</li>
              <li>To protect our users and ensure the safety of the platform.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">3. Information Sharing</h2>
            <p className="text-muted-foreground">
              We do not sell your personal information to third parties. We may share information with your consent, for legal reasons, or to protect the rights and safety of Lumatha and its users.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">4. Data Security</h2>
            <p className="text-muted-foreground">
              We work hard to protect Lumatha and our users from unauthorized access to or unauthorized alteration, disclosure, or destruction of information we hold. We use encryption to keep your data private while in transit.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">5. Your Privacy Controls</h2>
            <p className="text-muted-foreground">
              You have choices regarding the information we collect and how it's used. You can manage your privacy settings, including controlling who can see your posts and messages, in the Settings section of the app.
            </p>
          </section>

          <section className="border-t border-border pt-6 mt-8">
            <p className="text-xs text-muted-foreground">
              If you have questions about this Privacy Policy, please contact us at <a href="mailto:lumatha333@gmail.com" className="text-blue-500 hover:text-blue-600 hover:underline font-semibold">lumatha333@gmail.com</a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
