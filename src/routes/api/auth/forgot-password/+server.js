import { json, error } from '@sveltejs/kit';
import { db } from '$lib/db.js';
import prisma from '$lib/prisma.js';
import crypto from 'crypto';

export async function POST({ request }) {
  try {
    const data = await request.json();
    const { email } = data;
    
    if (!email) {
      throw error(400, 'Email is required');
    }
    
    // Check if user exists
    const user = await db.users.getByEmail(email);
    
    // Don't reveal if email exists or not for security
    // Always return success message
    if (user) {
      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetExpires = new Date(Date.now() + 3600000); // 1 hour from now
      
      // Update user with reset token
      await prisma.user.update({
        where: { id: user.id },
        data: {
          resetPasswordToken: resetToken,
          resetPasswordExpires: resetExpires
        }
      });
      
      // TODO: Send email with reset link
      // For now, we'll just log it (in production, use an email service)
      console.log(`Password reset token for ${email}: ${resetToken}`);
      console.log(`Reset link: /auth/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`);
    }
    
    // Always return success message (security best practice)
    return json({
      message: 'If an account with that email exists, a password reset link has been sent. Please check your email.'
    });
    
  } catch (err) {
    console.error('Forgot password error:', err);
    if (err.status) {
      throw err;
    }
    // Still return success message even on error (security best practice)
    return json({
      message: 'If an account with that email exists, a password reset link has been sent. Please check your email.'
    });
  }
}

