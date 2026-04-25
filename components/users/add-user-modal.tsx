'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { UserSchema, UserFormData } from '@/lib/schemas';
import { fetchApi } from '@/lib/api-client';
import { toast } from 'sonner';
import { X, UserPlus, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Props {
  onSuccess: () => void;
}

export function AddUserModal({ onSuccess }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Address Defect 40: Shared Zod Schema validation
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<UserFormData>({
    resolver: zodResolver(UserSchema),
    defaultValues: {
      role: 'user'
    }
  });

  const onSubmit = async (data: UserFormData) => {
    setIsSubmitting(true);
    const result = await fetchApi('/api/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (result.error) {
      toast.error(result.error.message);
    } else {
      toast.success('User created successfully');
      setIsOpen(false);
      reset();
      onSuccess();
    }
    setIsSubmitting(false);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium shadow-sm shadow-blue-200"
      >
        <UserPlus size={20} />
        Add User
      </button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-8"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900 border-l-4 border-blue-500 pl-4">Create New User</h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                  <input
                    {...register('username')}
                    type="text"
                    className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:outline-none transition-all ${
                      errors.username ? 'border-red-300 focus:ring-red-100' : 'border-gray-200 focus:ring-blue-100'
                    }`}
                    placeholder="e.g. johndoe"
                  />
                  {errors.username && (
                    <p className="mt-1 text-xs text-red-500">{errors.username.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <input
                    {...register('password')}
                    type="password"
                    className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:outline-none transition-all ${
                      errors.password ? 'border-red-300 focus:ring-red-100' : 'border-gray-200 focus:ring-blue-100'
                    }`}
                    placeholder="Min 6 characters"
                  />
                  {errors.password && (
                    <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <select
                    {...register('role')}
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all bg-white"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                    <option value="reseller">Reseller</option>
                  </select>
                </div>

                <div className="pt-4">
                  <button
                    disabled={isSubmitting}
                    type="submit"
                    className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <Loader2 className="animate-spin" size={20} />
                    ) : (
                      'Create User Account'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
