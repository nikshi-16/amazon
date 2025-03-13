'use client'
import { Button } from '@/components/ui/button';
import { useFormStatus } from 'react-dom'



const SignInWithGoogle = () => {
  // Placeholder function for Google Sign-In logic
  console.log("Signing in with Google...");
};

export function GoogleSignInForm() {
  const SignInButton = () => {
    const { pending } = useFormStatus()
    return (
      <Button disabled={pending} className='w-full' variant='outline'>
        {pending ? 'Redirecting to Google...' : 'Sign In with Google'}
      </Button>
    )
  }
  return (
    <form action={SignInWithGoogle}>
      <SignInButton />
    </form>
  )
}
