import { json, error } from '@sveltejs/kit';
import { db } from '$lib/db.js';
import prisma from '$lib/prisma.js';
import { hashPassword } from '$lib/utils/password.js';

export async function POST({ request }) {
  try {
    const data = await request.json();
    const { email, token, password, password_confirmation } = data;
    
    if (!email || !token || !password) {
      throw error(400, 'Email, token, and password are required');
    }
    
    if (password !== password_confirmation) {
      throw error(400, 'Passwords do not match');
    }
    
    if (password.length < 8) {
      throw error(400, 'Password must be at least 8 characters');
    }
    
    // Get user from database
    const user = await db.users.getByEmail(email);
    if (!user) {
      throw error(400, 'Invalid or expired reset token');
    }
    
    // Verify token and expiration
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id }
    });
    
    if (!dbUser || !dbUser.resetPasswordToken || dbUser.resetPasswordToken !== token) {
      throw error(400, 'Invalid or expired reset token');
    }
    
    if (!dbUser.resetPasswordExpires || dbUser.resetPasswordExpires < new Date()) {
      throw error(400, 'Reset token has expired. Please request a new password reset link.');
    }
    
    // Hash new password
    const hashedPassword = await hashPassword(password);
    
    // Update password and clear reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null
      }
    });
    
    return json({
      message: 'Password reset successfully. You can now log in with your new password.'
    });
    
  } catch (err) {
    console.error('Reset password error:', err);
    if (err.status) {
      throw err;
    }
    throw error(500, err.message || 'Failed to reset password');
  }
}

