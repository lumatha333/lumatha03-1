import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Terms() {
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
          <h1 className="text-lg font-semibold">Terms of Service</h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="prose prose-sm dark:prose-invert max-w-none space-y-6">
          <div>
            <p className="text-xs text-muted-foreground mb-4">Last updated: December 25, 2082</p>
            <p className="text-sm text-muted-foreground mb-4">Governed by the laws of Nepal</p>
          </div>

          <section>
            <h2 className="text-xl font-semibold mb-3">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground">
              By accessing, browsing, and using Lumatha ("the Platform"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, please do not use the Platform. We reserve the right to modify these Terms at any time, and your continued use of the Platform following any modifications constitutes your acceptance of the updated Terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">2. User Eligibility</h2>
            <p className="text-muted-foreground">
              You must be at least 13 years old to use Lumatha. By using the Platform, you represent and warrant that you are at least 13 years old and possess the legal authority to enter into this agreement. Parents and guardians are responsible for the use of Lumatha by minors under their supervision.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">3. User Accounts</h2>
            <p className="text-muted-foreground mb-3">
              To access certain features of Lumatha, you may be required to create an account. You agree to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>Provide accurate, current, and complete information</li>
              <li>Maintain the confidentiality of your account credentials</li>
              <li>Accept responsibility for all activities occurring under your account</li>
              <li>Notify us immediately of any unauthorized use of your account</li>
              <li>Not impersonate or misrepresent yourself or your affiliation with others</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">4. User Content</h2>
            <p className="text-muted-foreground mb-3">
              You retain ownership of any content you create and upload to Lumatha ("User Content"). By uploading User Content, you grant Lumatha a worldwide, royalty-free license to use, reproduce, distribute, and display your content for the purposes of operating and improving the Platform.
            </p>
            <p className="text-muted-foreground">
              You are responsible for ensuring that your User Content:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground mt-3">
              <li>Does not violate any laws or regulations</li>
              <li>Does not infringe upon the intellectual property rights of others</li>
              <li>Does not contain harmful, defamatory, obscene, or offensive material</li>
              <li>Does not constitute harassment, spam, or unwanted solicitation</li>
              <li>Is accurate and truthful to the best of your knowledge</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">5. Prohibited Activities</h2>
            <p className="text-muted-foreground mb-3">
              You agree not to engage in any of the following activities on Lumatha:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>Violating any applicable laws, regulations, or these Terms</li>
              <li>Creating fake, misleading, or duplicate accounts</li>
              <li>Harassing, bullying, or threatening other users</li>
              <li>Spreading misinformation or disinformation</li>
              <li>Hacking, phishing, or attempting to gain unauthorized access</li>
              <li>Uploading malware, viruses, or harmful code</li>
              <li>Spamming, advertising, or promoting external services without permission</li>
              <li>Scraping or collecting user data without authorization</li>
              <li>Circumventing age restrictions or platform protections</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">6. Intellectual Property Rights</h2>
            <p className="text-muted-foreground">
              Lumatha and all content provided by us (excluding User Content) are protected by copyright, trademark, and other intellectual property laws. You may not reproduce, distribute, modify, or create derivative works of our content without prior written permission.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">7. Disclaimer of Warranties</h2>
            <p className="text-muted-foreground">
              LUMATHA IS PROVIDED ON AN "AS-IS" AND "AS-AVAILABLE" BASIS. WE MAKE NO WARRANTIES, EXPRESS OR IMPLIED, REGARDING THE PLATFORM, INCLUDING WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, NON-INFRINGEMENT, OR ACCURACY. YOUR USE OF LUMATHA IS AT YOUR OWN RISK.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">8. Limitation of Liability</h2>
            <p className="text-muted-foreground">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, LUMATHA SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING OUT OF OR RELATED TO YOUR USE OF THE PLATFORM, EVEN IF WE HAVE BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">9. Termination</h2>
            <p className="text-muted-foreground">
              We reserve the right to terminate or suspend your account at any time for any reason, with or without notice. This includes violation of these Terms, illegal activity, or abuse of the Platform. Upon termination, your right to access and use Lumatha shall immediately cease.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">10. Governing Law</h2>
            <p className="text-muted-foreground">
              These Terms of Service are governed by and construed in accordance with the laws of Nepal, without regard to its conflict of law principles. Any legal action or proceeding relating to these Terms shall be brought exclusively in the courts located in Nepal, and you agree to submit to the personal jurisdiction of such courts.
            </p>
          </section>

          <section className="border-t border-border pt-6 mt-8">
            <p className="text-xs text-muted-foreground">
              If you have questions about these Terms of Service, please contact us at <a href="mailto:lumatha333@gmail.com" className="text-blue-500 hover:text-blue-600 hover:underline font-semibold">lumatha333@gmail.com</a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
