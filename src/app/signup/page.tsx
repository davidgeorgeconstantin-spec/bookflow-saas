import type { Metadata } from 'next';
import { SignupWizard } from '@/features/onboarding/SignupWizard';

export const metadata: Metadata = { title: 'Create your business' };

export default function SignupPage() {
  return <SignupWizard />;
}
