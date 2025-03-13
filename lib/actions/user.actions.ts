'use server'

import { signIn, signOut } from '@/auth'
import { IUserSignIn, IUserSignUp } from '@/types'
import { redirect } from 'next/navigation'
import { connectToDatabase } from '../db'
import User from '../db/models/user.model'
import bcrypt from 'bcryptjs'

import { formatError } from '../utils'
import { UserSignUpSchema } from '../validator'

// SIGN IN WITH CREDENTIALS
export async function signInWithCredentials(user: IUserSignIn) {
  return await signIn('credentials', { ...user, redirect: false })
}

// SIGN IN WITH GOOGLE
export async function signInWithGoogle() {
  await signIn('google')
}

// SIGN OUT
export async function SignOut() {
  const redirectTo = await signOut({ redirect: false })
  redirect(redirectTo.redirect)
}

// REGISTER USER
export async function registerUser(userSignUp: IUserSignUp) {
  try {
    // Validate input
    const user = await UserSignUpSchema.parseAsync({
      name: userSignUp.name,
      email: userSignUp.email,
      password: userSignUp.password,
      confirmPassword: userSignUp.confirmPassword,
    })

    // Connect to DB
    await connectToDatabase()

    // Create new user
    await User.create({
      ...user,
      password: await bcrypt.hash(user.password, 5),
    })

    return { success: true, message: 'User created successfully' }
  } catch (error) {
    return { success: false, error: formatError(error) }
  }
}
