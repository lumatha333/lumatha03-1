import React from 'react';
import { ArrowLeft, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Privacy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/40">
        <div className="flex items-center gap-4 p-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold">Privacy Policy</h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Key Highlights */}
        <div className="grid gap-3 mb-8">
          <div className="flex items-center gap-3 p-4 rounded-lg bg-green-500/10 border border-green-500/20">
            <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
            <span className="text-sm text-foreground">We don't sell your data</span>
          </div>
          <div className="flex items-center gap-3 p-4 rounded-lg bg-green-500/10 border border-green-500/20">
            <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
            <span className="text-sm text-foreground">You control your content</span>
          </div>
          <div className="flex items-center gap-3 p-4 rounded-lg bg-green-500/10 border border-green-500/20">
            <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
            <span className="text-sm text-foreground">You can delete anytime</span>
          </div>
        </div>

        {/* Privacy Policy Content */}
        <div className="prose prose-sm dark:prose-invert max-w-none space-y-6">
          <div>
            <p className="text-xs text-muted-foreground mb-4">Last updated: December 25, 2082</p>
          </div>

          <section>
            <h2 className="text-xl font-semibold mb-3">1. Introduction</h2>
            <p className="text-muted-foreground">
              Welcome to Lumatha. We are committed to protecting your privacy and ensuring you have a positive experience on our platform. This Privacy Policy explains how we collect, use, disclose, and otherwise process your personal information through our website, mobile application, and related services.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">2. Information We Collect</h2>
            <p className="text-muted-foreground mb-3">We collect information in several ways:</p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li><strong>Information you provide:</strong> Your name, email address, phone number, profile photo, bio, and any other information you choose to share in your profile or through communications.</li>
              <li><strong>Usage information:</strong> How you interact with Lumatha, including the content you view, create, like, comment on, and share.</li>
              <li><strong>Device information:</strong> Technical data about your device, browser type, IP address, and operating system.</li>
              <li><strong>Location information:</strong> Your country and region, which you may provide or we may infer from your IP address.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">3. How We Use Your Information</h2>
            <p className="text-muted-foreground mb-3">We use the information we collect for various purposes:</p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>Providing and improving our services</li>
              <li>Creating and maintaining your account</li>
              <li>Personalizing your experience</li>
              <li>Communicating with you about our services</li>
              <li>Responding to your inquiries and support requests</li>
              <li>Analyzing usage patterns to enhance our platform</li>
              <li>Detecting and preventing fraud or abuse</li>
              <li>Complying with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">4. Data Sharing and Disclosure</h2>
            <p className="text-muted-foreground">
              We do not sell your personal information to third parties. However, we may share your information in the following circumstances:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground mt-3">
              <li><strong>Service providers:</strong> We may share information with companies that help us operate Lumatha, such as hosting providers and analytics services.</li>
              <li><strong>Legal requirements:</strong> We may disclose information when required by law or in response to legal processes.</li>
              <li><strong>User consent:</strong> We share information when you explicitly consent or when it's necessary to provide services you request.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">5. Your Privacy Rights and Choices</h2>
            <p className="text-muted-foreground">
              You have the right to access, correct, or delete your personal information. You can update your profile information anytime through your account settings. You can also request deletion of your account and associated data.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">6. Data Security</h2>
            <p className="text-muted-foreground">
              We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the Internet or electronic storage is completely secure.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">7. Data Retention</h2>
            <p className="text-muted-foreground">
              We retain your personal information for as long as necessary to provide our services and fulfill the purposes for which it was collected, unless a longer retention period is required or permitted by law. You can delete your account anytime, which will remove most of your personal information from our systems.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">8. Children's Privacy</h2>
            <p className="text-muted-foreground">
              Lumatha is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If we become aware that we have collected information from a child under 13, we will take steps to delete such information promptly.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">9. Changes to Privacy Policy</h2>
            <p className="text-muted-foreground">
              We may update this Privacy Policy from time to time to reflect changes in our practices, technology, legal requirements, or other factors. We will notify you of significant changes by posting the updated Privacy Policy on our website and updating the "Last Updated" date.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">10. Contact Us</h2>
            <p className="text-muted-foreground">
              If you have questions about this Privacy Policy or our privacy practices, please contact us at <a href="mailto:lumatha333@gmail.com" className="text-blue-500 hover:text-blue-600 hover:underline font-semibold inline-flex items-center gap-1">lumatha333@gmail.com</a>. We will respond to your inquiry within 30 days.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
