import NextAuth, { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';

export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(prisma) as any,
    providers: [
          CredentialsProvider({
                  name: 'credentials',
                  credentials: {
                            email: { label: 'Email', type: 'email' },
                            password: { label: 'Password', type: 'password' },
                  },
                  async authorize(credentials) {
                            if (!credentials?.email || !credentials?.password) {
                                        throw new Error('Email and password are required');
                            }

                    const user = await prisma.user.findUnique({
                                where: { email: credentials.email.toLowerCase() },
                    });

                    if (!user || !user.password_hash) {
                                throw new Error('Invalid email or password');
                    }

                    const isValid = await bcrypt.compare(credentials.password, user.password_hash);

                    if (!isValid) {
                                throw new Error('Invalid email or password');
                    }

                    return {
                                id: user.id,
                                email: user.email,
                                name: user.name,
                                role: user.role,
                    };
                  },
          }),
        ],
    session: {
          strategy: 'jwt',
    },
    callbacks: {
          async jwt({ token, user }) {
                  if (user) {
                            token.id = user.id;
                            token.role = (user as any).role;
                  }
                  return token;
          },
          async session({ session, token }) {
                  if (session.user) {
                            (session.user as any).id = token.id;
                            (session.user as any).role = token.role;
                  }
                  return session;
          },
    },
    pages: {
          signIn: '/auth/login',
          error: '/auth/error',
    },
    secret: process.env.NEXTAUTH_SECRET,
};
